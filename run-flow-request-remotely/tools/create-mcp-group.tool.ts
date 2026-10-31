import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";
import {
  createMcpGroup,
  McpGroupError,
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
    "create_mcp_group",
    "Create an MCP group with a filtered set of tools and a new mg_ JWT API key",
    {
      name: z.string().min(1).describe("Name of the MCP group"),
      tools: z.array(z.string()).optional().describe(
        "Tool names available to this group",
      ),
    },
    createLoggedTool(
      "create_mcp_group",
      async ({ name, tools }: { name: string; tools?: string[] }) => {
        try {
          const { group, token } = await createMcpGroup(
            { name, tools: tools || [] },
            context.allowedTools,
          );
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({ group, token }),
            }],
          };
        } catch (error) {
          if (error instanceof McpGroupError) {
            return errorResult(error.message);
          }
          return errorResult(
            error instanceof Error
              ? error.message
              : "Failed to create the MCP group",
          );
        }
      },
    ),
  );
}
