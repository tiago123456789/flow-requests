import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { syncMcpFlowTools } from "./mcp-flows-registry.ts";

export default function (
  mcpServer: McpServer,
  createLoggedTool: any,
) {
  mcpServer.tool(
    "refresh_mcp_tools",
    "Reload dynamic MCP flow tools from the mcp_flows table (call after creating/updating via REST)",
    createLoggedTool("refresh_mcp_tools", async () => {
      const result = await syncMcpFlowTools(mcpServer, createLoggedTool);
      return {
        content: [{
          type: "text",
          text: `MCP tools refreshed: ${JSON.stringify(result)}`,
        }],
      };
    }),
  );
}
