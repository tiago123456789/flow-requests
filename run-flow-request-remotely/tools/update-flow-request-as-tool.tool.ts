import { getDb } from "../db/knex.ts";
import {
  buildZodRawShape,
  MCP_TOOL_NAME_REGEX,
} from "../utils/build-zod-schema.util.ts";
import {
  validateMcpFlowName,
  validateMcpFlowSchema,
} from "../utils/validate-mcp-flow.util.ts";
import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";
import { refreshMcpTools } from "./refresh-mcp-flows.tool.ts";

type SchemaEntry = { name: string; type: string; description: string };

function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

export default function (
  mcpServer: McpServer,
  createLoggedTool: any,
  context?: { allowedTools: ReadonlySet<string> | null },
) {
  return mcpServer.tool(
    "update_flow_request_as_tool",
    "Update a flow request by ID and sync its associated dynamic MCP tool",
    {
      id: z.string().uuid().describe("ID of the flow request to update"),
      name: z.string().min(1).describe(
        "Tool name; spaces are converted to underscores",
      ),
      description: z.string().min(1).describe("Description of the MCP tool"),
      flow: z.object({}).passthrough().describe("Flow JSON object to execute"),
      schema: z.array(z.object({
        name: z.string().min(1).describe("Input key name used by the flow"),
        type: z.string().min(1).describe("Supported Zod input type"),
        description: z.string().describe("Description of this input key"),
      })),
      plugins: z.array(z.unknown()).optional().describe(
        "Optional custom flow plugins",
      ),
    },
    createLoggedTool(
      "update_flow_request_as_tool",
      async ({
        id,
        name,
        description,
        flow,
        schema,
        plugins,
      }: {
        id: string;
        name: string;
        description: string;
        flow: Record<string, any>;
        schema: SchemaEntry[];
        plugins?: any[];
      }) => {
        const normalizedName = name.trim().replace(/\s+/g, "_");
        if (!normalizedName || !MCP_TOOL_NAME_REGEX.test(normalizedName)) {
          return errorResult(
            "name must match ^[a-zA-Z0-9_-]{1,64}$ after replacing spaces with underscores",
          );
        }
        const nameError = validateMcpFlowName(normalizedName);
        if (nameError) return errorResult(nameError);

        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
          return errorResult("description is required");
        }
        if (!flow || typeof flow !== "object" || Array.isArray(flow)) {
          return errorResult("flow must be a JSON object");
        }

        const flowInput = flow as Record<string, any>;
        const wrappedFlow = flowInput.flow;
        const normalizedFlow = wrappedFlow &&
            typeof wrappedFlow === "object" && !Array.isArray(wrappedFlow)
          ? wrappedFlow as Record<string, any>
          : flowInput;
        const normalizedPlugins = Array.isArray(plugins)
          ? plugins
          : Array.isArray(flowInput.plugins)
          ? flowInput.plugins
          : [];

        const cleanedSchema = schema.map((entry) => ({
          name: entry.name.trim(),
          type: entry.type.trim(),
          description: entry.description.trim(),
        }));
        if (cleanedSchema.some((entry) => !entry.description)) {
          return errorResult("Each schema entry must have a description");
        }
        const schemaError = validateMcpFlowSchema(cleanedSchema);
        if (schemaError) return errorResult(schemaError);

        try {
          buildZodRawShape(cleanedSchema);
        } catch (error: any) {
          return errorResult(error?.message || "invalid schema");
        }

        const requestData = {
          flow: normalizedFlow,
          name: normalizedName,
          plugins: normalizedPlugins,
        };
        const db = getDb();

        let updateResult: { mcpFlowsUpdated: number } | null;
        try {
          updateResult = await db.transaction(async (trx) => {
            const flowRequest = await trx("flow_requests")
              .where("id", id)
              .forUpdate()
              .first();
            if (!flowRequest) return null;

            const associatedMcpFlows = await trx("mcp_flows")
              .where("flow_request_id", id)
              .select("id");

            await trx("flow_requests").where("id", id).update({
              name: normalizedName,
              data: JSON.stringify(requestData),
              flow: JSON.stringify(normalizedFlow),
              description: trimmedDescription,
              schema: JSON.stringify(cleanedSchema),
            });

            if (associatedMcpFlows.length > 0) {
              await trx("mcp_flows")
                .where("flow_request_id", id)
                .update({
                  schema: JSON.stringify(cleanedSchema),
                  updated_at: trx.fn.now(),
                });
            }

            return { mcpFlowsUpdated: associatedMcpFlows.length };
          });
        } catch (error: any) {
          return errorResult(
            error?.message || "Failed to update the flow request",
          );
        }

        if (!updateResult) {
          return errorResult(`Flow request ${id} not found`);
        }

        if (updateResult.mcpFlowsUpdated === 0) {
          return {
            content: [{
              type: "text" as const,
              text:
                `Flow request updated. id=${id}; no associated MCP flow found, so MCP tools were not synced.`,
            }],
          };
        }

        const syncResult = await refreshMcpTools(
          mcpServer,
          createLoggedTool,
          context?.allowedTools ?? undefined,
        );
        return {
          content: [{
            type: "text" as const,
            text:
              `Flow request updated. id=${id}, mcp_flows_updated=${updateResult.mcpFlowsUpdated}, sync=${
                JSON.stringify(syncResult)
              }`,
          }],
        };
      },
    ),
  );
}
