import { getDb } from "../db/knex.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";

export default function (mcpServer: McpServer, createLoggedTool: any) {
  mcpServer.tool(
    "get_flow_created",
    "Return the flows created",
    createLoggedTool("get_flow_created", async () => {
      const db = getDb();
      const webhooks = await db("flow_requests")

      return {
        content: [{ type: "text", text: `Webhooks: ${JSON.stringify(webhooks)}` }],
      }
    })
  )

}