import {
  MCP_TOOL_NAME_REGEX,
  type McpFlowField,
} from "./build-zod-schema.util.ts";

export const STATIC_TOOL_NAMES = [
  "run_flow_request",
  "get_flow_created",
  "get_webhooks",
  "refresh_mcp_tools",
  "save_flow_request",
  "save_flow_request_as_tool",
  "update_flow_request_as_tool",
  "delete_flow_request",
  "create_mcp_group",
];

export function validateMcpFlowName(name: unknown): string | null {
  if (typeof name !== "string" || name.length === 0) {
    return "name must be a non-empty string";
  }
  if (!MCP_TOOL_NAME_REGEX.test(name)) {
    return "name must match ^[a-zA-Z0-9_-]{1,64}$ (MCP tool name constraint)";
  }
  if (STATIC_TOOL_NAMES.includes(name)) {
    return `name "${name}" collides with a built-in static tool`;
  }
  return null;
}

export function validateMcpFlowSchema(schema: unknown): string | null {
  if (!Array.isArray(schema)) {
    return "schema must be an array of {name, type, description} entries";
  }
  const seen = new Set<string>();
  for (const item of schema) {
    if (typeof item !== "object" || item === null) {
      return "each schema entry must be an object {name, type, description}";
    }
    const { name, key: legacyKey, type, isRequired } = item as McpFlowField;
    const schemaKey = name || legacyKey;
    if (typeof schemaKey !== "string" || !MCP_TOOL_NAME_REGEX.test(schemaKey)) {
      return `schema key "${String(schemaKey)}" must match ^[a-zA-Z0-9_-]{1,64}$`;
    }
    if (seen.has(schemaKey)) {
      return `duplicate schema key "${schemaKey}"`;
    }
    seen.add(schemaKey);
    if (typeof type !== "string" || type.length === 0) {
      return `schema entry "${schemaKey}" must have a zod type string (e.g. string, number, boolean, integer, uuid, email, url, datetime, date, array, object, any)`;
    }
    if (isRequired !== undefined && typeof isRequired !== "boolean") {
      return `schema entry "${schemaKey}" must have boolean isRequired`;
    }
    const description = (item as McpFlowField).description;
    if (description !== undefined && typeof description !== "string") {
      return `schema entry "${schemaKey}" description must be a string`;
    }
  }
  return null;
}

export function validateMcpFlowPayload(body: any): string | null {
  if (typeof body !== "object" || body === null) return "invalid body";
  const nameErr = validateMcpFlowName(body.name);
  if (nameErr) return nameErr;
  if (typeof body.description !== "string" || body.description.length === 0) {
    return "description must be a non-empty string";
  }
  const schemaErr = validateMcpFlowSchema(body.schema);
  if (schemaErr) return schemaErr;
  if (
    typeof body.flow_request_id !== "string" || body.flow_request_id.length === 0
  ) {
    return "flow_request_id must be a non-empty UUID string";
  }
  return null;
}
