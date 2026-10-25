import * as pluginRepository from "@/repositories/plugins.repository";
import CustomNodeManager from "@/utils/custom-node-manager.util";
import PackageUtil from "@/utils/package.util";
import WorkflowEngine from "@/services/workflow/workflow-engine";

const packageUtil = new PackageUtil();

export default async function executeWorkflow(
  workflow: {
    nodes: Array<{ [key: string]: any }>;
    envData: Array<{ [key: string]: any }>;
  },
  requestData: {
    headers: Record<string, string>;
    body: Record<string, unknown>;
    query: Record<string, string>;
  },
) {
  const plugins = await pluginRepository.getAll();
  const customNodeManager = new CustomNodeManager(plugins, packageUtil);
  const workflowEngine = new WorkflowEngine(customNodeManager);

  await workflowEngine.process(workflow, requestData);
  const state = workflowEngine.getState();
  const failedStep = Object.entries(state.steps || {}).find(
    ([, step]: [string, any]) => step?.output?.error,
  );

  if (failedStep) {
    const [stepName, step] = failedStep as [string, any];
    const message =
      step.output.error.message ||
      step.output.error.data?.message ||
      `Step “${stepName}” failed`;
    throw new Error(message);
  }

  return state;
}
