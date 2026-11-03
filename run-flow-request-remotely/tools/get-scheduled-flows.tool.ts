import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { getDb } from "../db/knex.ts";

export default function (mcpServer: McpServer, createLoggedTool: any) {
  return mcpServer.tool(
    "get_scheduled_flows",
    "List scheduled flows with their cron expressions and next execution times",
    createLoggedTool("get_scheduled_flows", async () => {
      const schedules = await getDb()("scheduled_flows")
        .select(
          "scheduled_flows.id",
          "scheduled_flows.flow_request_id",
          "scheduled_flows.cron_expression",
          "scheduled_flows.created_at",
          "scheduled_flows.next_execution_at",
          "flow_requests.name as flow_name",
        )
        .join(
          "flow_requests",
          "scheduled_flows.flow_request_id",
          "flow_requests.id",
        )
        .orderBy("scheduled_flows.next_execution_at", "asc");

      return {
        content: [{ type: "text" as const, text: JSON.stringify(schedules) }],
      };
    }),
  );
}
