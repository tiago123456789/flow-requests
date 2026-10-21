import getFlowsCreated from "./get-flows-created.tool.ts" 
import getWebhooks from "./get-webhooks.tool.ts" 
import runFlowRequest from "./run-flow-request.tool.ts" 
import saveFlowRequest from "./save-flow-request.tool.ts"
import saveFlowRequestAsTool from "./save-flow-request-as-tool.tool.ts"
import updateFlowRequestAsTool from "./update-flow-request-as-tool.tool.ts"
import deleteFlowRequest from "./delete-flow-request.tool.ts"
import refreshMcpFlows from "./refresh-mcp-flows.tool.ts"
import { syncMcpFlowTools } from "./mcp-flows-registry.ts"
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";

function createLoggedTool(
  toolName: string, 
  handler: (args: any) => Promise<any>
) {
  return async (args: any) => {
    // Log ANTES da execução
    console.log(`[${new Date().toISOString()}] [MCP-TOOL] [BEFORE] Calling "${toolName}" with arguments:`, JSON.stringify(args));
    
    const startTime = performance.now();
    try {
      const result = await handler(args);
      const duration = (performance.now() - startTime).toFixed(2);
      
      // Log DEPOIS da execução (Sucesso)
      console.log(`[${new Date().toISOString()}] [MCP-TOOL] [AFTER] "${toolName}" executed successfully in ${duration}ms.`);
      return result;
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2);
      
      // Log DEPOIS da execução (Erro)
      console.error(`[${new Date().toISOString()}] [MCP-TOOL] [ERROR] "${toolName}" failed after ${duration}ms. Error:`, error);
      throw error;
    }
  };
}

export async function start(mcpServer: McpServer) {
    getFlowsCreated(mcpServer, createLoggedTool)
    getWebhooks(mcpServer, createLoggedTool)
    runFlowRequest(mcpServer, createLoggedTool)
    saveFlowRequest(mcpServer, createLoggedTool)
    saveFlowRequestAsTool(mcpServer, createLoggedTool)
    updateFlowRequestAsTool(mcpServer, createLoggedTool)
    deleteFlowRequest(mcpServer, createLoggedTool)
    refreshMcpFlows(mcpServer, createLoggedTool)
    await syncMcpFlowTools(mcpServer, createLoggedTool)
}

export { createLoggedTool };
