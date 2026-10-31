import { getDb } from "../db/knex.ts";
import { refreshMcpTools } from "./refresh-mcp-flows.tool.ts";
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
    "save_flow_request_as_tool",
    "Create a new flow request and register it as a dynamic MCP tool",
    {
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
      "save_flow_request_as_tool",
      async ({
        name,
        description,
        flow,
        schema,
        plugins,
      }: {
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
          // Validate that every requested type can be materialized as Zod.
          buildZodRawShape(cleanedSchema);
        } catch (error: any) {
          return errorResult(error?.message || "invalid schema");
        }

        const db = getDb();
        const duplicate = await db("mcp_flows").where("name", normalizedName)
          .first();
        if (duplicate) {
          return errorResult(`MCP tool "${normalizedName}" already exists`);
        }

        const requestData = {
          flow: normalizedFlow,
          name: normalizedName,
          plugins: normalizedPlugins,
        };

        let flowRequestId: string;
        let mcpFlowId: string;
        try {
          const ids = await db.transaction(async (trx) => {
            const flowRequestResult = await trx("flow_requests")
              .insert({
                name: normalizedName,
                data: JSON.stringify(requestData),
                flow: JSON.stringify(normalizedFlow),
                description: trimmedDescription,
                schema: JSON.stringify(cleanedSchema),
              })
              .returning("id");
            const newFlowRequestId = flowRequestResult[0].id as string;

            const mcpFlowResult = await trx("mcp_flows")
              .insert({
                name: normalizedName,
                description: trimmedDescription,
                schema: JSON.stringify(cleanedSchema),
                flow_request_id: newFlowRequestId,
              })
              .returning("id");

            return {
              flowRequestId: newFlowRequestId,
              mcpFlowId: mcpFlowResult[0].id as string,
            };
          });
          flowRequestId = ids.flowRequestId;
          mcpFlowId = ids.mcpFlowId;
        } catch (error: any) {
          return errorResult(
            error?.message || "Failed to save the flow request and MCP tool",
          );
        }

        const refreshResult = await refreshMcpTools(
          mcpServer,
          createLoggedTool,
          context?.allowedTools ?? undefined,
        );
        const visibleInCurrentView = !context?.allowedTools ||
          context.allowedTools.has(normalizedName);
        if (
          visibleInCurrentView &&
          !refreshResult.added.includes(normalizedName) &&
          !refreshResult.updated.includes(normalizedName)
        ) {
          const reason = refreshResult.skipped.find(
            (item) => item.name === normalizedName,
          )?.reason || "tool was not registered";
          await db.transaction(async (trx) => {
            await trx("mcp_flows").where("id", mcpFlowId).del();
            await trx("flow_requests").where("id", flowRequestId).del();
          });
          // Run the same refresh tool operation again to remove any partial registration.
          await refreshMcpTools(
            mcpServer,
            createLoggedTool,
            context?.allowedTools ?? undefined,
          );
          return errorResult(
            `Flow saved but MCP tool refresh failed: ${reason}`,
          );
        }

        return {
          content: [{
            type: "text" as const,
            text: visibleInCurrentView
              ? `Flow request created and MCP tool registered. flow_request_id=${flowRequestId}, mcp_flow_id=${mcpFlowId}, tool=${normalizedName}. Refresh: ${
                JSON.stringify(refreshResult)
              }`
              : `Flow request created and MCP tool saved. flow_request_id=${flowRequestId}, mcp_flow_id=${mcpFlowId}, tool=${normalizedName}. The tool is not part of this MCP group, so it is not available in the current group view.`,
          }],
        };
      },
    ),
  );
}
