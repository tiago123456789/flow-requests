import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";
import { deleteFlowRequest } from "../utils/delete-flow-request.util.ts";
import { refreshMcpTools } from "./refresh-mcp-flows.tool.ts";

function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

export default function (
  mcpServer: McpServer,
  createLoggedTool: any,
) {
  mcpServer.tool(
    "delete_flow_request",
    "Delete a flow request by ID, remove its associated MCP flows, and sync dynamic MCP tools",
    {
      id: z.string().uuid().describe("ID of the flow request to delete"),
    },
    createLoggedTool(
      "delete_flow_request",
      async ({ id }: { id: string }) => {
        const deleted = await deleteFlowRequest(id);
        if (!deleted) return errorResult(`Flow request ${id} not found`);

        const syncResult = await refreshMcpTools(
          mcpServer,
          createLoggedTool,
        );

        return {
          content: [{
            type: "text" as const,
            text:
              `Flow request deleted. id=${deleted.id}, mcp_flows_deleted=${deleted.mcpFlowsDeleted}, sync=${
                JSON.stringify(syncResult)
              }`,
          }],
        };
      },
    ),
  );
}
