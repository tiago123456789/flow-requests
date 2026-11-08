import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";
import { deleteMcpGroup } from "../utils/mcp-groups.util.ts";
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
    "delete_mcp_group",
    "Permanently delete an MCP group by its UUID. The group's token is immediately revoked. Requires admin API key.",
    {
      id: z.string().uuid().describe("UUID of the MCP group to delete"),
    },
    createLoggedTool(
      "delete_mcp_group",
      async ({ id }: { id: string }) => {
        if (context.allowedTools !== null) {
          return errorResult("Admin API key required");
        }

        const deleted = await deleteMcpGroup(id);
        if (!deleted) {
          return errorResult("MCP group not found");
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ deleted: true, id }),
          }],
        };
      },
    ),
  );
}
