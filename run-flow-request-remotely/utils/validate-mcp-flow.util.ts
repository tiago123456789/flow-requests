import {
  MCP_TOOL_NAME_REGEX,
  type McpFlowField,
} from "./build-zod-schema.util.ts";

export const STATIC_TOOL_NAMES = [
  "run_flow_request",
  "get_flow_created",
  "get_webhooks",
  "refresh_mcp_tools",
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
    return "schema must be an array of {key, type, isRequired}";
  }
  const seen = new Set<string>();
  for (const item of schema) {
    if (typeof item !== "object" || item === null) {
      return "each schema entry must be an object {key, type, isRequired}";
    }
    const { key, type, isRequired } = item as McpFlowField;
    if (typeof key !== "string" || !MCP_TOOL_NAME_REGEX.test(key)) {
      return `schema key "${String(key)}" must match ^[a-zA-Z0-9_-]{1,64}$`;
    }
    if (seen.has(key)) {
      return `duplicate schema key "${key}"`;
    }
    seen.add(key);
    if (typeof type !== "string" || type.length === 0) {
      return `schema entry "${key}" must have a zod type string (e.g. string, number, boolean, integer, uuid, email, url, datetime, date, array, object, any)`;
    }
    if (typeof isRequired !== "boolean") {
      return `schema entry "${key}" must have boolean isRequired`;
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
