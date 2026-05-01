import { Hono } from "hono";
import { cors } from "hono/cors";
import CustomNodeManager from "./utils/custom-node-manager.util.ts";
import PackageUtil from "./utils/package.util.ts";
import WorkflowEngine from "./workflow/workflow-engine.ts";
import { getDb, initDatabase, isWebhookMode } from "./db/knex.ts";

const app = new Hono();

app.use("/*", cors());

async function run(
  headers: { [key: string]: any },
  body: { [key: string]: any },
  plugins: Array<{ [key: string]: any }> = [],
  flow: { [key: string]: any },
) {
  const packageUtil = new PackageUtil();
  const customNodeManager = new CustomNodeManager(
    plugins as Array<{
      url: string;
      libraryName: string;
    }>,
    packageUtil,
  );
  const workflowEngine = new WorkflowEngine(customNodeManager);

  console.log("Starting flow-request now");
  const flowData = flow.data;
  await workflowEngine.process(
    {
      nodes: flowData.nodes,
      envData: flowData.envData,
    },
    {
      headers,
      body,
    },
  );

  console.log("Finished flow-request now");
  return workflowEngine;
}

function checkApiKey(c: any) {
  const apiKey = c.req.header("api-key") || c.req.query("api-key");
  if (apiKey !== Deno.env.get("API_KEY")) {
    return c.text("Unauthorized", 401);
  }
  return null;
}

app.post("/run", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const body = await c.req.json();
  if (!body.plugins) body.plugins = [];
  if (!body.flow) body.flow = { data: { nodes: [], envData: [] } };

  const headers = Object.fromEntries(c.req.raw.headers.entries());
  const workflowEngine = await run(headers, body, body.plugins, body.flow);

  return c.json({
    status: "ok",
    steps: workflowEngine.getState().steps,
  });
});

app.post("/flow-requests", async (c) => {
  const unauthorized = checkApiKey(c);
  if (unauthorized) return unauthorized;

  const body = await c.req.json();

  const db = getDb();
    const result = await db("flow_requests")
      .insert({ data: JSON.stringify(body || {}) })
      .returning("id");

  return c.json({ id: result[0].id }, 201);
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

    console.log(flowRequest)
  if (!flowRequest) {
    return c.text("Flow request not found", 404);
  }

  const requestHeaders = Object.fromEntries(c.req.raw.headers.entries());
  const requestBody = await c.req.json().catch(() => ({}));

  const flowData = flowRequest.data;
  const workflowEngine = await run(
    requestHeaders,
    requestBody,
    flowData.plugins || [],
    flowData.flow || { data: { nodes: [], envData: [] } },
  );

  return c.json({
    status: "ok",
    steps: workflowEngine.getState().steps,
  });
});

if (isWebhookMode()) {
  await initDatabase();
}

Deno.serve({ port: 8000 }, app.fetch);
