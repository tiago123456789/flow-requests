import { getDb } from "../db/knex.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";

export default function (mcpServer: McpServer, createLoggedTool: any) {
  return mcpServer.tool(
    "save_flow_request",
    "Save a flow request by name, update the register if the name already exists",
    {
      name: z.string().min(1),
      data: z.object({}).passthrough(),
    },
    createLoggedTool(
      "save_flow_request",
      async ({ name, data }: { name: string; data: Record<string, any> }) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return {
            isError: true,
            content: [{ type: "text", text: `Flow request name is required!` }],
          };
        }

        const payload: Record<string, any> = { ...(data || {}), name: trimmedName };
        const db = getDb();
        const existing = await db("flow_requests")
          .where("name", trimmedName)
          .first();

        if (existing) {
          await db("flow_requests").where("id", existing.id).update({
            data: JSON.stringify(payload),
            flow: payload.flow ? JSON.stringify(payload.flow) : existing.flow,
            description: payload.description || existing.description,
            schema: payload.schema ? JSON.stringify(payload.schema) : existing.schema,
          });
          return {
            content: [
              {
                type: "text",
                text: `Flow request "${trimmedName}" updated! id=${existing.id}`,
              },
            ],
          };
        }

        const result = await db("flow_requests")
          .insert({
            name: trimmedName,
            data: JSON.stringify(payload),
            flow: payload.flow ? JSON.stringify(payload.flow) : null,
            description: payload.description || null,
            schema: JSON.stringify(payload.schema || []),
          })
          .returning("id");

        return {
          content: [
            {
              type: "text",
              text: `Flow request "${trimmedName}" saved! id=${result[0].id}`,
            },
          ],
        };
      },
    ),
  );
}
