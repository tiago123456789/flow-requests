export interface McpFlowSchemaEntry {
  key: string;
  type: string;
  isRequired: boolean;
  description?: string;
}

export interface McpFlow {
  id: string;
  name: string;
  description: string;
  schema: string | McpFlowSchemaEntry[];
  flow_request_id: string;
  flow_name: string | null;
  created_at: string;
  updated_at: string;
}

export function parseMcpFlowSchema(
  schema: McpFlow["schema"]
): McpFlowSchemaEntry[] {
  if (Array.isArray(schema)) return schema;
  if (typeof schema === "string") {
    if (!schema.trim()) return [];
    try {
      const parsed = JSON.parse(schema);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
