import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
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
    "delete_scheduled_flow",
    "Delete a scheduled flow by its schedule ID",
    {
      id: z.string().regex(/^[1-9]\d*$/).describe(
        "Positive integer ID of the scheduled flow to delete",
      ),
    },
    createLoggedTool(
      "delete_scheduled_flow",
      async ({ id }: { id: string }) => {
        const deleted = await getDb()("scheduled_flows").where("id", id).del();
        if (!deleted) return errorResult(`Scheduled flow ${id} not found`);

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
