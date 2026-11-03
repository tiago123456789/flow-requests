import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { getDb } from "../db/knex.ts";

export default function (mcpServer: McpServer, createLoggedTool: any) {
  return mcpServer.tool(
    "get_form_flows",
    "List saved forms and the flow requests that their submissions trigger",
    createLoggedTool("get_form_flows", async () => {
      const db = getDb();
      const forms = await db("forms_flows")
        .select(
          "forms_flows.id",
          "forms_flows.data",
          "forms_flows.description",
          "forms_flows.created_at",
          "forms_flows.flow_request_id",
          "flow_requests.name as flow_name",
        )
        .leftJoin(
          "flow_requests",
          "forms_flows.flow_request_id",
          "flow_requests.id",
        )
        .orderBy("forms_flows.created_at", "desc");

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(forms.map((form: Record<string, any>) => ({
            ...form,
            render_url: `/forms-render/${form.id}`,
          }))),
        }],
      };
    }),
  );
}
