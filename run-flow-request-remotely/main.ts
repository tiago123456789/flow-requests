import CustomNodeManager from "./utils/custom-node-manager.util.ts";
import PackageUtil from "./utils/package.util.ts";
import WorkflowEngine from "./workflow/workflow-engine.ts";

async function run(
  headers: { [key: string]: any },
  body: { [key: string]: any },
  plugins: Array<{ [key: string]: any }> = [],
  flow: { [key: string]: any },
) {
  const packageUtil = new PackageUtil();
  const flowPlugins = plugins;
  const customNodeManager = new CustomNodeManager(
    flowPlugins as Array<{
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

Deno.serve(async (request: Request) => {
  if (request.headers.get("api-key") !== process.env.API_KEY) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  let body: { [key: string]: any } = {};
  if (request.body) {
    body = await request.json();
    if (!body.plugins) body.plugins = [];
    if (!body.flow) body.flow = { data: { nodes: [], envData: [] } };
    const headers = Object.fromEntries(request.headers.entries());
    await run(headers, body, body.plugins, body.flow);
  }

  return new Response("ok");
});
