import WorkflowEngine from "../workflow/workflow-engine.ts";
import CustomNodeManager from "./custom-node-manager.util.ts";
import PackageUtil from "./package.util.ts";
import {
  buildErrorLog,
  buildLogs,
  saveFlowLogs,
} from "./flow-logs.util.ts";
import prometheusMetricsUtil from "./prometheus-metrics.util.ts";
import type { Counter, Histogram } from "prom-client";

const FLOW_LABEL_NAMES = ["flow_request_id", "flow_name", "status"] as const;
const FLOW_DURATION_LABEL_NAMES = ["flow_request_id", "flow_name"] as const;

export async function run(
  headers: { [key: string]: any },
  body: { [key: string]: any },
  query: { [key: string]: any } = {},
  plugins: Array<{ [key: string]: any }> = [],
  flow: { [key: string]: any },
  flowRequestId: string | null = null,
  flowName: string | null = null,
) {
  const requestData = { headers, body, query };
  let workflowEngine: WorkflowEngine | undefined;
  let executionError: unknown = null;

  const resolvedFlowRequestId = flowRequestId ?? "unknown";
  const resolvedFlowName = flowName ?? "unknown";

  // Start histogram timer before execution begins.
  const histogram = prometheusMetricsUtil.getMetrics({
    name: "flow_execution_duration_seconds",
    help: "Flow execution duration in seconds",
    type: "histogram",
    labelNames: [...FLOW_DURATION_LABEL_NAMES],
  }) as Histogram;
  const endTimer = histogram.startTimer({
    flow_request_id: resolvedFlowRequestId,
    flow_name: resolvedFlowName,
  });

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
    // Record duration regardless of success or failure.
    endTimer();

    // Increment total executions counter with final status.
    const counter = prometheusMetricsUtil.getMetrics({
      name: "flow_executions_total",
      help: "Total number of flow executions",
      type: "counter",
      labelNames: [...FLOW_LABEL_NAMES],
    }) as Counter;
    counter.inc({
      flow_request_id: resolvedFlowRequestId,
      flow_name: resolvedFlowName,
      status: executionError ? "error" : "success",
    });

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
