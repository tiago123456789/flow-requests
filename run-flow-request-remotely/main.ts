import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDb, initDatabase, isWebhookMode } from "./db/knex.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "jsr:@hono/mcp";
import { run } from "./utils/execute-flow.util.ts"
import {
  createFilteredMcpServer,
  createLoggedTool,
  start,
} from "./tools/index.ts";
import { syncMcpFlowTools } from "./tools/mcp-flows-registry.ts";
import { validateMcpFlowPayload } from "./utils/validate-mcp-flow.util.ts";
import { buildZodRawShape } from "./utils/build-zod-schema.util.ts";
import { getFlowRequestExecutionData } from "./utils/flow-request-data.util.ts";
import { deleteFlowRequest } from "./utils/delete-flow-request.util.ts";
import {
  authenticateMcpGroupToken,
  createMcpGroup,
  deleteMcpGroup,
  getMcpGroup,
  listAvailableMcpTools,
  listMcpGroups,
  McpGroupError,
  removeToolFromMcpGroup,
  resetMcpGroupToken,
  updateMcpGroup,
} from "./utils/mcp-groups.util.ts";
import type { McpGroup } from "./utils/mcp-groups.util.ts";

const app = new Hono();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

app.use("/*", cors());


function getApiKey(c: any): string | undefined {
  return c.req.header("api-key") || c.req.query("api-key");
}

function checkApiKey(c: any) {
  const configuredApiKey = Deno.env.get("API_KEY");
  const apiKey = getApiKey(c);
  if (!configuredApiKey || apiKey !== configuredApiKey) {
    return c.text("Unauthorized", 401);
  }
  return null;
}

type McpAuth = { kind: "admin" } | { kind: "group"; group: McpGroup };

async function resolveMcpAuth(c: any): Promise<McpAuth | null> {
  const apiKey = getApiKey(c);
  if (!apiKey) return null;

  const configuredApiKey = Deno.env.get("API_KEY");
  if (configuredApiKey && apiKey === configuredApiKey) {
    return { kind: "admin" };
  }

  if (apiKey.startsWith("mg_")) {
    const group = await authenticateMcpGroupToken(apiKey);
    if (group) return { kind: "group", group };
  }

  return null;
}

function handleMcpGroupError(c: any, error: unknown) {
  if (error instanceof McpGroupError) {
    return c.json({ error: error.message }, error.status as any);
  }
  console.error("[MCP-GROUPS] Unexpected error:", error);
  return c.json({ error: "Internal server error" }, 500);
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
      flow: body?.flow ? JSON.stringify(body.flow) : existing.flow,
      description: body?.description || existing.description,
      schema: body?.schema ? JSON.stringify(body.schema) : existing.schema,
    });
    return c.json({ id: existing.id, updated: true }, 200);
  }

  const result = await db("flow_requests")
    .insert({
      name,
      data: JSON.stringify(body || {}),
      flow: body?.flow ? JSON.stringify(body.flow) : null,
      description: body?.description || null,
      schema: JSON.stringify(body?.schema || []),
    })
    .returning("id");

  return c.json({ id: result[0].id, created: true }, 201);
});

app.delete("/flow-requests/:id", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const id = c.req.param("id");
  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "id must be a UUID" }, 400);
  }

  const deleted = await deleteFlowRequest(id);
  if (!deleted) return c.json({ error: "flow_request not found" }, 404);

  const syncResult = await syncMcpFlowTools(mcpServer, createLoggedTool);
  return c.json({
    deleted: true,
    id: deleted.id,
    mcp_flows_deleted: deleted.mcpFlowsDeleted,
    sync: syncResult,
  });
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
  const rows = await db("mcp_flows")
    .select(
      "mcp_flows.*",
      "flow_requests.name as flow_name",
    )
    .leftJoin("flow_requests", "mcp_flows.flow_request_id", "flow_requests.id")
    .orderBy("mcp_flows.created_at", "desc");
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

app.get("/mcp-tools", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  return c.json({ tools: await listAvailableMcpTools() });
});

app.get("/mcp-groups", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  return c.json({ groups: await listMcpGroups() });
});

app.post("/mcp-groups", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "invalid body" }, 400);

  try {
    const result = await createMcpGroup({
      name: body.name,
      tools: body.tools ?? [],
    });
    return c.json(result, 201);
  } catch (error) {
    return handleMcpGroupError(c, error);
  }
});

app.get("/mcp-groups/:id", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const id = c.req.param("id");
  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "id must be a UUID" }, 400);
  }

  const group = await getMcpGroup(id);
  if (!group) return c.json({ error: "MCP group not found" }, 404);
  const { jwt_token: _jwtToken, ...view } = group;
  return c.json({ group: view });
});

app.put("/mcp-groups/:id", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const id = c.req.param("id");
  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "id must be a UUID" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "invalid body" }, 400);

  try {
    const group = await updateMcpGroup(id, {
      name: body.name,
      tools: body.tools,
    });
    return c.json({ group });
  } catch (error) {
    return handleMcpGroupError(c, error);
  }
});

app.delete("/mcp-groups/:id", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const id = c.req.param("id");
  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "id must be a UUID" }, 400);
  }

  const deleted = await deleteMcpGroup(id);
  if (!deleted) return c.json({ error: "MCP group not found" }, 404);
  return c.json({ deleted: true });
});

app.post("/mcp-groups/:id/reset-token", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const id = c.req.param("id");
  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "id must be a UUID" }, 400);
  }

  try {
    const { token } = await resetMcpGroupToken(id);
    return c.json({ token });
  } catch (error) {
    return handleMcpGroupError(c, error);
  }
});

app.delete("/mcp-groups/:id/tools/:toolName", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const id = c.req.param("id");
  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "id must be a UUID" }, 400);
  }

  try {
    const group = await removeToolFromMcpGroup(id, c.req.param("toolName"));
    return c.json({ group });
  } catch (error) {
    return handleMcpGroupError(c, error);
  }
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

  const flowData = getFlowRequestExecutionData(flowRequest);
  const workflowEngine = await run(
    requestHeaders,
    requestBody,
    requestQuery,
    flowData.plugins,
    flowData.flow,
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
  const auth = await resolveMcpAuth(c);
  if (!auth) return c.text("Unauthorized", 401);

  if (auth.kind === "admin") {
    if (!mcpServer.isConnected()) {
      await mcpServer.connect(transport);
    }
    return transport.handleRequest(c as any);
  }

  const groupServer = await createFilteredMcpServer(
    {
      name: `run-flow-requests-remotely-mcp-group-${auth.group.name}`,
      version: "1.0.0",
    },
    new Set(auth.group.tools),
  );
  const groupTransport = new StreamableHTTPTransport();
  await groupServer.connect(groupTransport);
  return groupTransport.handleRequest(c as any);
});

Deno.serve({ port: 7000 }, app.fetch);
