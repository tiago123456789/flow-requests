import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";
import { getDb } from "../db/knex.ts";
import { getLatestFlowLogs } from "../utils/flow-logs.util.ts";

function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

export default function (mcpServer: McpServer, createLoggedTool: any) {
  return mcpServer.tool(
    "get_flow_request_logs",
    "Return the last 10 executions of a flow request, ordered by executed_at descending",
    {
      id: z.string().uuid().describe("ID of the flow request"),
    },
    createLoggedTool(
      "get_flow_request_logs",
      async ({ id }: { id: string }) => {
        const db = getDb();
        const flowRequest = await db("flow_requests").where("id", id).first();
        if (!flowRequest) {
          return errorResult(`Flow request ${id} not found`);
        }

        const logs = await getLatestFlowLogs(id);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(logs) }],
        };
      },
    ),
  );
}
