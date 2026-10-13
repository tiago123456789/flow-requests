import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDb, initDatabase, isWebhookMode } from "./db/knex.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "jsr:@hono/mcp";
import { run } from "./utils/execute-flow.util.ts"
import { createLoggedTool, start } from "./tools/index.ts";
import { syncMcpFlowTools } from "./tools/mcp-flows-registry.ts";
import { validateMcpFlowPayload } from "./utils/validate-mcp-flow.util.ts";
import { buildZodRawShape } from "./utils/build-zod-schema.util.ts";

const app = new Hono();

app.use("/*", cors());


function checkApiKey(c: any) {
  const apiKey = c.req.header("api-key") || c.req.query("api-key");
  if (apiKey !== Deno.env.get("API_KEY")) {
    return c.text("Unauthorized", 401);
  }
  return null;
}

const mcpServer = new McpServer({
  name: "run-flow-requests-remotly-mcp",
  version: "1.0.0",
});

app.get("/health", (c) => c.json({ message: "ok" }))

app.post("/run", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const body = await c.req.json();
  if (!body.plugins) body.plugins = [];
  if (!body.flow) body.flow = { data: { nodes: [], envData: [] } };

  const headers = Object.fromEntries(c.req.raw.headers.entries());
  const query = Object.fromEntries(new URL(c.req.url).searchParams);
  const workflowEngine = await run(headers, body, query, body.plugins, body.flow);

  return c.json({
    status: "ok",
    steps: workflowEngine.getState().steps,
  });
});

app.post("/flow-requests", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const body = await c.req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return c.json({ error: "name is required" }, 400);

  const db = getDb();
  const existing = await db("flow_requests").where("name", name).first();

  if (existing) {
    await db("flow_requests").where("id", existing.id).update({
      data: JSON.stringify(body || {}),
    });
    return c.json({ id: existing.id, updated: true }, 200);
  }

  const result = await db("flow_requests")
    .insert({ name, data: JSON.stringify(body || {}) })
    .returning("id");

  return c.json({ id: result[0].id, created: true }, 201);
});

app.post("/mcp-flows", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const body = await c.req.json().catch(() => null);
  const validationError = validateMcpFlowPayload(body);
  if (validationError) return c.json({ error: validationError }, 400);

  // Fail fast on unsupported zod types before persisting.
  try {
    buildZodRawShape(body.schema);
  } catch (error: any) {
    return c.json({ error: error?.message || "invalid schema" }, 400);
  }

  const db = getDb();
  const flowRequest = await db("flow_requests").where(
    "id",
    body.flow_request_id,
  ).first();
  if (!flowRequest) return c.json({ error: "flow_request_id not found" }, 404);

  const nameTaken = await db("mcp_flows").where("name", body.name).first();
  if (nameTaken) return c.json({ error: `mcp_flow "${body.name}" already exists` }, 409);

  const result = await db("mcp_flows")
    .insert({
      name: body.name,
      description: body.description,
      schema: JSON.stringify(body.schema),
      flow_request_id: body.flow_request_id,
    })
    .returning("id");

  return c.json({ id: result[0].id, refresh_required: true }, 201);
});

app.get("/mcp-flows", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const db = getDb();
  const rows = await db("mcp_flows").select("*").orderBy("created_at", "desc");
  return c.json({ tools: rows });
});

app.post("/mcp-flows/refresh", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const result = await syncMcpFlowTools(mcpServer, createLoggedTool);
  return c.json(result);
});

app.get("/mcp-flows/:id", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const db = getDb();
  const row = await db("mcp_flows").where("id", c.req.param("id")).first();
  if (!row) return c.json({ error: "mcp_flow not found" }, 404);
  return c.json(row);
});

app.put("/mcp-flows/:id", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const body = await c.req.json().catch(() => null);
  const validationError = validateMcpFlowPayload(body);
  if (validationError) return c.json({ error: validationError }, 400);

  try {
    buildZodRawShape(body.schema);
  } catch (error: any) {
    return c.json({ error: error?.message || "invalid schema" }, 400);
  }

  const db = getDb();
  const existing = await db("mcp_flows").where("id", c.req.param("id")).first();
  if (!existing) return c.json({ error: "mcp_flow not found" }, 404);

  const flowRequest = await db("flow_requests").where(
    "id",
    body.flow_request_id,
  ).first();
  if (!flowRequest) return c.json({ error: "flow_request_id not found" }, 404);

  if (body.name !== existing.name) {
    const nameTaken = await db("mcp_flows").where("name", body.name).first();
    if (nameTaken) {
      return c.json({ error: `mcp_flow "${body.name}" already exists` }, 409);
    }
  }

  await db("mcp_flows").where("id", c.req.param("id")).update({
    name: body.name,
    description: body.description,
    schema: JSON.stringify(body.schema),
    flow_request_id: body.flow_request_id,
    updated_at: db.fn.now(),
  });

  return c.json({ id: c.req.param("id"), refresh_required: true });
});

app.delete("/mcp-flows/:id", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const db = getDb();
  const deleted = await db("mcp_flows").where("id", c.req.param("id")).del();
  if (!deleted) return c.json({ error: "mcp_flow not found" }, 404);
  return c.json({ deleted: true, refresh_required: true });
});

app.post("/webhooks/:id_flow_request/run", async (c) => {
  if (!isWebhookMode()) {
    return c.text("Webhook mode is disabled", 403);
  }

  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const id = c.req.param("id_flow_request");
  const db = getDb();

  const flowRequest = await db("flow_requests")
    .where("id", id)
    .first();

  if (!flowRequest) {
    return c.text("Flow request not found", 404);
  }

  const requestHeaders = Object.fromEntries(c.req.raw.headers.entries());
  const requestBody = await c.req.json().catch(() => ({}));
  const requestQuery = Object.fromEntries(new URL(c.req.url).searchParams);

  const flowData = flowRequest.data;
  const workflowEngine = await run(
    requestHeaders,
    requestBody,
    requestQuery,
    flowData.plugins || [],
    flowData.flow || { data: { nodes: [], envData: [] } },
  );

  return c.json({
    status: "ok",
    steps: workflowEngine.getState().steps,
  });
});

await initDatabase();

await start(mcpServer)

const transport = new StreamableHTTPTransport();

app.all("/mcp", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  if (!mcpServer.isConnected()) {
    await mcpServer.connect(transport);
  }

  return transport.handleRequest(c);
});

Deno.serve({ port: 7000 }, app.fetch);
