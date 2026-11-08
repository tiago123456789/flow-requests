import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";
import {
  McpGroupError,
  resetMcpGroupToken,
} from "../utils/mcp-groups.util.ts";
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
    "revoke_mcp_group_token",
    "Reset the API key (mg_ JWT token) for an MCP group. The previous token is immediately invalidated and a new one is returned. Requires admin API key.",
    {
      id: z.string().uuid().describe("UUID of the MCP group whose token to revoke"),
    },
    createLoggedTool(
      "revoke_mcp_group_token",
      async ({ id }: { id: string }) => {
        if (context.allowedTools !== null) {
          return errorResult("Admin API key required");
        }

        try {
          const { token } = await resetMcpGroupToken(id);
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({ id, token }),
            }],
          };
        } catch (error) {
          if (error instanceof McpGroupError) {
            return errorResult(error.message);
          }
          return errorResult(
            error instanceof Error
              ? error.message
              : "Failed to revoke the MCP group token",
          );
        }
      },
    ),
  );
}
