import z from "npm:zod";

export type McpFlowField = {
  key: string;
  type: string;
  isRequired: boolean;
  description?: string;
};

export const MCP_TOOL_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export function buildZodRawShape(
  fields: McpFlowField[],
): Record<string, ReturnType<typeof z.string>> {
  const shape: Record<string, any> = {};

  for (const field of fields) {
    const t = String(field.type).toLowerCase().trim();
    let zodType: any;

    switch (t) {
      case "string":
        zodType = z.string();
        break;
      case "number":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "integer":
      case "int":
        zodType = z.number().int();
        break;
      case "bigint":
        zodType = z.bigint();
        break;
      case "uuid":
        zodType = z.string().uuid();
        break;
      case "email":
        zodType = z.string().email();
        break;
      case "url":
        zodType = z.string().url();
        break;
      case "datetime":
        zodType = z.string().datetime();
        break;
      case "date":
        zodType = z.date();
        break;
      case "array":
      case "json":
        zodType = z.array(z.any());
        break;
      case "object":
        zodType = z.object({}).passthrough();
        break;
      case "any":
      case "unknown":
        zodType = z.any();
        break;
      default:
        throw new Error(
          `Unsupported zod type "${field.type}" for key "${field.key}". Supported: string, number, boolean, integer/int, bigint, uuid, email, url, datetime, date, array, object, any/unknown, json.`,
        );
    }

    const describeText = field.description || field.key;
    zodType = zodType.describe(describeText);

    if (!field.isRequired) {
      zodType = zodType.optional();
    }

    shape[field.key] = zodType;
  }

  return shape;
}
