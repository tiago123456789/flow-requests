import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { listMcpGroups } from "../utils/mcp-groups.util.ts";
import type { ToolContext } from "./types.ts";

function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

export default function (
  mcpServer: McpServer,
  createLoggedTool: any,
  context: ToolContext,
) {
  return mcpServer.tool(
    "list_mcp_groups",
    "List all MCP groups with a summary of their id, name, creation date, and tool count. Requires admin API key.",
    createLoggedTool("list_mcp_groups", async () => {
      if (context.allowedTools !== null) {
        return errorResult("Admin API key required");
      }

      const groups = await listMcpGroups();
      const summary = groups.map(({ id, name, created_at, tools }) => ({
        id,
        name,
        created_at,
        tool_count: tools.length,
        tools,
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary) }],
      };
    }),
  );
}
