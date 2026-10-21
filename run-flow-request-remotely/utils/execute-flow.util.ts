import WorkflowEngine from "../workflow/workflow-engine.ts";
import CustomNodeManager from "./custom-node-manager.util.ts";
import PackageUtil from "./package.util.ts";

export async function run(
  headers: { [key: string]: any },
  body: { [key: string]: any },
  query: { [key: string]: any } = {},
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
      query,
    },
  );

  console.log("Finished flow-request now");
  return workflowEngine;
}