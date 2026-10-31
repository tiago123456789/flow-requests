import { getDb } from "../db/knex.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";

export default function (mcpServer: McpServer, createLoggedTool: any) {
  return mcpServer.tool(
    "get_webhooks",
    "Return the webhooks from Flow requests created",
    {},
    createLoggedTool("get_webhooks", async () => {
      const db = getDb();
      const webhooks = await db("flow_requests")

      return {
        content: [{ type: "text", text: `Webhooks: ${JSON.stringify(webhooks)}` }],
      }
    })

  )
}