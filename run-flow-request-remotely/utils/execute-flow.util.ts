import WorkflowEngine from "../workflow/workflow-engine.ts";
import CustomNodeManager from "./custom-node-manager.util.ts";
import PackageUtil from "./package.util.ts";
import {
  buildErrorLog,
  buildLogs,
  saveFlowLogs,
} from "./flow-logs.util.ts";

export async function run(
  headers: { [key: string]: any },
  body: { [key: string]: any },
  query: { [key: string]: any } = {},
  plugins: Array<{ [key: string]: any }> = [],
  flow: { [key: string]: any },
  flowRequestId: string | null = null,
) {
  const requestData = { headers, body, query };
  let workflowEngine: WorkflowEngine | undefined;
  let executionError: unknown = null;

  try {
    const packageUtil = new PackageUtil();
    const customNodeManager = new CustomNodeManager(
      plugins as Array<{
        url: string;
        libraryName: string;
      }>,
      packageUtil,
    );
    workflowEngine = new WorkflowEngine(customNodeManager);

    console.log("Starting flow-request now");
    const flowData = flow.data;
    await workflowEngine.process(
      {
        nodes: flowData.nodes,
        envData: flowData.envData,
      },
      requestData,
    );

    console.log("Finished flow-request now");
    return workflowEngine;
  } catch (error) {
    executionError = error;
    throw error;
  } finally {
    const logs = buildLogs(workflowEngine?.getState()?.steps);
    if (executionError) {
      logs.push(buildErrorLog(requestData, executionError));
    }

    try {
      await saveFlowLogs(logs, flowRequestId);
    } catch (error) {
      console.error("Failed to save flow logs:", error);
    }
  }
}
