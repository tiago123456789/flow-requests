import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";
import { getDb } from "../db/knex.ts";
import { validateFormFlowData } from "../utils/form-flow.util.ts";

function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

export default function (mcpServer: McpServer, createLoggedTool: any) {
  return mcpServer.tool(
    "create_form_flow",
    "Create a public form that runs a saved flow request when submitted",
    {
      data: z.object({}).passthrough().describe(
        "Form JSON data with title, buttonText, and inputs",
      ),
      flowId: z.string().uuid().describe(
        "UUID of the saved flow request to run on form submission",
      ),
      description: z.string().optional().describe(
        "Optional form description, trimmed and limited to 150 characters",
      ),
    },
    createLoggedTool(
      "create_form_flow",
      async ({
        data,
        flowId,
        description = "",
      }: {
        data: Record<string, any>;
        flowId: string;
        description?: string;
      }) => {
        const trimmedDescription = description.trim();
        if (trimmedDescription.length > 150) {
          return errorResult("description must be at most 150 characters");
        }

        const validation = validateFormFlowData(data);
        if (!validation.data) {
          return errorResult(validation.error ?? "Invalid form data");
        }

        const db = getDb();
        const flowRequest = await db("flow_requests")
          .where("id", flowId)
          .first();
        if (!flowRequest) {
          return errorResult(`flowId ${flowId} not found`);
        }

        const [form] = await db("forms_flows")
          .insert({
            data: JSON.stringify(validation.data),
            description: trimmedDescription,
            flow_request_id: flowId,
          })
          .returning(["id", "flow_request_id"]);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              id: form.id,
              flow_request_id: form.flow_request_id,
              render_url: `/forms-render/${form.id}`,
            }),
          }],
        };
      },
    ),
  );
}
