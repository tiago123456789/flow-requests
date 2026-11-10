import getFlowsCreated from "./get-flows-created.tool.ts";
import getWebhooks from "./get-webhooks.tool.ts";
import runFlowRequest from "./run-flow-request.tool.ts";
import saveFlowRequest from "./save-flow-request.tool.ts";
import saveFlowRequestAsTool from "./save-flow-request-as-tool.tool.ts";
import updateFlowRequestAsTool from "./update-flow-request-as-tool.tool.ts";
import deleteFlowRequest from "./delete-flow-request.tool.ts";
import getFlowRequestLogs from "./get-flow-request-logs.tool.ts";
import refreshMcpFlows from "./refresh-mcp-flows.tool.ts";
import createMcpGroup from "./create-mcp-group.tool.ts";
import getFormFlows from "./get-form-flows.tool.ts";
import createFormFlow from "./create-form-flow.tool.ts";
import deleteFormFlow from "./delete-form-flow.tool.ts";
import getScheduledFlows from "./get-scheduled-flows.tool.ts";
import deleteScheduledFlow from "./delete-scheduled-flow.tool.ts";
import createScheduledFlow from "./create-scheduled-flow.tool.ts";
import listMcpGroups from "./list-mcp-groups.tool.ts";
import revokeMcpGroupToken from "./revoke-mcp-group-token.tool.ts";
import deleteMcpGroup from "./delete-mcp-group.tool.ts";
import { syncMcpFlowTools } from "./mcp-flows-registry.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CreateLoggedTool,
  ToolContext,
  ToolRegistrar,
} from "./types.ts";
import prometheusMetricsUtil from "../utils/prometheus-metrics.util.ts";
import type { Counter, Histogram } from "prom-client";

const toolRegistrars = new Map<string, ToolRegistrar>([
  ["get_flow_created", getFlowsCreated],
  ["get_webhooks", getWebhooks],
  ["run_flow_request", runFlowRequest],
  ["save_flow_request", saveFlowRequest],
  ["save_flow_request_as_tool", saveFlowRequestAsTool],
  ["update_flow_request_as_tool", updateFlowRequestAsTool],
  ["delete_flow_request", deleteFlowRequest],
  ["get_flow_request_logs", getFlowRequestLogs],
  ["refresh_mcp_tools", refreshMcpFlows],
  ["create_mcp_group", createMcpGroup],
  ["get_form_flows", getFormFlows],
  ["create_form_flow", createFormFlow],
  ["delete_form_flow", deleteFormFlow],
  ["get_scheduled_flows", getScheduledFlows],
  ["delete_scheduled_flow", deleteScheduledFlow],
  ["create_scheduled_flow", createScheduledFlow],
  ["list_mcp_groups", listMcpGroups],
  ["revoke_mcp_group_token", revokeMcpGroupToken],
  ["delete_mcp_group", deleteMcpGroup],
]);

export function createLoggedTool(
  toolName: string,
  handler: (args: any) => Promise<any>,
) {
  return async (args: any) => {
    console.log(
      `[${new Date().toISOString()}] [MCP-TOOL] [BEFORE] Calling "${toolName}" with arguments:`,
      JSON.stringify(args),
    );

    const startTime = performance.now();
    try {
      const result = await handler(args);
      const duration = (performance.now() - startTime).toFixed(2);

      console.log(
        `[${new Date().toISOString()}] [MCP-TOOL] [AFTER] "${toolName}" executed successfully in ${duration}ms.`,
      );
      return result;
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2);

      console.error(
        `[${new Date().toISOString()}] [MCP-TOOL] [ERROR] "${toolName}" failed after ${duration}ms. Error:`,
        error,
      );
      throw error;
    }
  };
}

/**
 * Similar to createLoggedTool but records Prometheus metrics instead of logs.
 *
 * Metrics tracked (both labelled with `tool_name`):
 *  - mcp_tool_calls_total          Counter   — incremented on every invocation
 *  - mcp_tool_duration_seconds     Histogram — execution time per tool call
 */
export function createTrackedTool(
  toolName: string,
  handler: (args: any) => Promise<any>,
) {
  const labelNames = ["tool_name"];
  const labels = { tool_name: toolName };

  return async (args: any) => {
    const counter = prometheusMetricsUtil.getMetrics({
      name: "mcp_tool_calls_total",
      help: "Total number of MCP tool calls",
      type: "counter",
      labelNames,
    }) as Counter;
    counter.inc(labels);

    const histogram = prometheusMetricsUtil.getMetrics({
      name: "mcp_tool_duration_seconds",
      help: "MCP tool execution duration in seconds",
      type: "histogram",
      labelNames,
    }) as Histogram;
    const end = histogram.startTimer(labels);

    try {
      return await handler(args);
    } finally {
      end();
    }
  };
}

// Composes logging + Prometheus tracking for every tool invocation.
// createTrackedTool wraps the raw handler first (inner),
// then createLoggedTool wraps the tracked handler (outer).
function createLoggedAndTrackedTool(
  toolName: string,
  handler: (args: any) => Promise<any>,
) {
  return createLoggedTool(toolName, createTrackedTool(toolName, handler));
}

export function registerStaticTools(
  mcpServer: McpServer,
  createLogged: CreateLoggedTool,
  context: ToolContext,
) {
  for (const [name, registrar] of toolRegistrars) {
    if (context.allowedTools && !context.allowedTools.has(name)) continue;
    registrar(mcpServer, createLogged, context);
  }
}

export async function createFilteredMcpServer(
  serverInfo: { name: string; version: string },
  allowedTools: ReadonlySet<string> | null,
): Promise<McpServer> {
  const mcpServer = new McpServer(serverInfo);
  registerStaticTools(mcpServer, createLoggedAndTrackedTool, { allowedTools });
  await syncMcpFlowTools(
    mcpServer,
    createLoggedAndTrackedTool,
    allowedTools ?? undefined,
  );
  return mcpServer;
}

export async function start(mcpServer: McpServer) {
  registerStaticTools(mcpServer, createLoggedAndTrackedTool, { allowedTools: null });
  await syncMcpFlowTools(mcpServer, createLoggedAndTrackedTool);
}
