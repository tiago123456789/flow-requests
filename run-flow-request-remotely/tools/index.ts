import getFlowsCreated from "./get-flows-created.tool.ts";
import getWebhooks from "./get-webhooks.tool.ts";
import runFlowRequest from "./run-flow-request.tool.ts";
import saveFlowRequest from "./save-flow-request.tool.ts";
import saveFlowRequestAsTool from "./save-flow-request-as-tool.tool.ts";
import updateFlowRequestAsTool from "./update-flow-request-as-tool.tool.ts";
import deleteFlowRequest from "./delete-flow-request.tool.ts";
import refreshMcpFlows from "./refresh-mcp-flows.tool.ts";
import createMcpGroup from "./create-mcp-group.tool.ts";
import { syncMcpFlowTools } from "./mcp-flows-registry.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CreateLoggedTool,
  ToolContext,
  ToolRegistrar,
} from "./types.ts";

const toolRegistrars = new Map<string, ToolRegistrar>([
  ["get_flow_created", getFlowsCreated],
  ["get_webhooks", getWebhooks],
  ["run_flow_request", runFlowRequest],
  ["save_flow_request", saveFlowRequest],
  ["save_flow_request_as_tool", saveFlowRequestAsTool],
  ["update_flow_request_as_tool", updateFlowRequestAsTool],
  ["delete_flow_request", deleteFlowRequest],
  ["refresh_mcp_tools", refreshMcpFlows],
  ["create_mcp_group", createMcpGroup],
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
  registerStaticTools(mcpServer, createLoggedTool, { allowedTools });
  await syncMcpFlowTools(
    mcpServer,
    createLoggedTool,
    allowedTools ?? undefined,
  );
  return mcpServer;
}

export async function start(mcpServer: McpServer) {
  registerStaticTools(mcpServer, createLoggedTool, { allowedTools: null });
  await syncMcpFlowTools(mcpServer, createLoggedTool);
}
