import { getDb } from "../db/knex.ts";
import { run } from "../utils/execute-flow.util.ts";
import { buildZodRawShape } from "../utils/build-zod-schema.util.ts";
import type { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import type { RegisteredTool } from "npm:@modelcontextprotocol/sdk/server/mcp.js";

// Tracks currently registered dynamic tools by MCP tool name.
export const dynamicTools = new Map<string, RegisteredTool>();

export type SyncResult = {
  added: string[];
  updated: string[];
  removed: string[];
  skipped: Array<{ name: string; reason: string }>;
};

export async function syncMcpFlowTools(
  mcpServer: McpServer,
  createLoggedTool: (
    toolName: string,
    handler: (args: any) => Promise<any>,
  ) => (args: any) => Promise<any>,
): Promise<SyncResult> {
  const db = getDb();
  const rows = await db("mcp_flows").select("*");

  const result: SyncResult = { added: [], updated: [], removed: [], skipped: [] };
  const seenNames = new Set<string>();

  for (const row of rows) {
    const name = row.name as string;
    seenNames.add(name);

    let shape: Record<string, any>;
    try {
      const schemaArray = Array.isArray(row.schema) ? row.schema : [];
      shape = buildZodRawShape(schemaArray);
    } catch (error: any) {
      result.skipped.push({ name, reason: error?.message || "invalid schema" });
      console.error(
        `[MCP-FLOWS] Skipping tool "${name}": ${error?.message}`,
      );
      continue;
    }

    const flowRequestId = row.flow_request_id as string;
    const description = row.description as string;

    const handler = createLoggedTool(name, async (body: Record<string, any>) => {
      console.log(body)
      const dbInner = getDb();
      const flowRequest = await dbInner("flow_requests")
        .where("id", flowRequestId)
        .first();

      if (!flowRequest) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Flow request ${flowRequestId} not found for tool "${name}"!`,
          }],
        };
      }

      const flowData = flowRequest.data;
      const workflowEngine = await run(
        body || {},
        body || {},
        body || {},
        flowData.plugins || [],
        flowData.flow || { data: { nodes: [], envData: [] } },
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify(workflowEngine.getState().steps),
        }],
      };
    });

    const existing = dynamicTools.get(name);
    if (existing) {
      try {
        existing.update({
          description,
          paramsSchema: shape,
          callback: handler,
        });
        result.updated.push(name);
      } catch (error: any) {
        result.skipped.push({
          name,
          reason: `update failed: ${error?.message}`,
        });
      }
    } else {
      try {
        const registered = mcpServer.tool(name, description, shape, handler);
        dynamicTools.set(name, registered);
        result.added.push(name);
      } catch (error: any) {
        result.skipped.push({
          name,
          reason: `register failed: ${error?.message}`,
        });
      }
    }
  }

  // Remove tools deleted from DB.
  for (const [name, handle] of dynamicTools) {
    if (!seenNames.has(name)) {
      try {
        handle.remove();
      } catch (error) {
        console.error(`[MCP-FLOWS] Failed to remove tool "${name}":`, error);
      }
      dynamicTools.delete(name);
      result.removed.push(name);
    }
  }

  try {
    mcpServer.sendToolListChanged();
  } catch {
    // Not connected yet (initial boot) — safe to ignore.
  }

  console.log(
    `[MCP-FLOWS] Sync done. added=${result.added.length} updated=${result.updated.length} removed=${result.removed.length} skipped=${result.skipped.length}`,
  );
  return result;
}
