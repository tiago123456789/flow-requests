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
    "delete_form_flow",
    "Delete a saved form by its ID without deleting the linked flow request",
    {
      id: z.string().uuid().describe("UUID of the form to delete"),
    },
    createLoggedTool(
      "delete_form_flow",
      async ({ id }: { id: string }) => {
        const deleted = await getDb()("forms_flows").where("id", id).del();
        if (!deleted) return errorResult(`Form ${id} not found`);

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
