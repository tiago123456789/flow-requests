import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { Cron } from "croner";
import z from "npm:zod";
import { getDb } from "../db/knex.ts";

function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

export default function (mcpServer: McpServer, createLoggedTool: any) {
  return mcpServer.tool(
    "create_scheduled_flow",
    "Schedule an existing flow request using a cron expression evaluated in UTC",
    {
      flowId: z.string().uuid().describe(
        "UUID of the saved flow request to schedule",
      ),
      cronExpression: z.string().trim().min(1).describe(
        "Cron expression for the schedule, evaluated in UTC (for example, 0 9 * * *)",
      ),
    },
    createLoggedTool(
      "create_scheduled_flow",
      async (
        { flowId, cronExpression }: { flowId: string; cronExpression: string },
      ) => {
        const expression = cronExpression.trim();
        let nextExecution: Date;
        try {
          const cron = new Cron(expression, { timezone: "UTC" });
          const nextRun = cron.nextRuns(1, new Date())[0];
          if (!nextRun || Number.isNaN(nextRun.getTime())) {
            return errorResult("cronExpression has no future execution");
          }
          nextExecution = nextRun;
        } catch (error) {
          return errorResult(
            error instanceof Error ? error.message : "Invalid cronExpression",
          );
        }

        const db = getDb();
        const flowRequest = await db("flow_requests").where("id", flowId)
          .first();
        if (!flowRequest) {
          return errorResult(`Flow request ${flowId} not found`);
        }

        const [schedule] = await db("scheduled_flows")
          .insert({
            flow_request_id: flowId,
            cron_expression: expression,
            next_execution_at: nextExecution,
          })
          .returning([
            "id",
            "flow_request_id",
            "cron_expression",
            "created_at",
            "next_execution_at",
          ]);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ schedule }),
          }],
        };
      },
    ),
  );
}
