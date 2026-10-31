import { getDb } from "../db/knex.ts";
import {
  createMcpGroupToken,
  verifyMcpGroupToken,
} from "./jwt.util.ts";
import { MCP_TOOL_NAME_REGEX } from "./build-zod-schema.util.ts";
import { STATIC_TOOL_NAMES } from "./validate-mcp-flow.util.ts";

export type McpGroup = {
  id: string;
  name: string;
  jwt_token: string;
  tools: string[];
  created_at: string;
  updated_at: string;
};

export type McpGroupView = Omit<McpGroup, "jwt_token">;

export type AvailableMcpTool = {
  name: string;
  type: "built-in" | "dynamic";
};

export class McpGroupError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "McpGroupError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    (error as { code?: unknown }).code === "23505";
}

function normalizeGroupName(name: unknown): string {
  if (typeof name !== "string") {
    throw new McpGroupError(400, "name must be a non-empty string");
  }
  const normalized = name.trim();
  if (!normalized || normalized.length > 255) {
    throw new McpGroupError(
      400,
      "name must be between 1 and 255 characters",
    );
  }
  return normalized;
}

export function toMcpGroupView(group: McpGroup): McpGroupView {
  const { jwt_token: _jwtToken, ...view } = group;
  return view;
}

async function getDynamicToolNames(): Promise<string[]> {
  const rows = await getDb()("mcp_flows").select("name").orderBy("name");
  return rows.map((row) => row.name as string);
}

async function getAvailableToolNameSet(): Promise<Set<string>> {
  return new Set([
    ...STATIC_TOOL_NAMES,
    ...(await getDynamicToolNames()),
  ]);
}

async function normalizeGroupTools(
  tools: unknown,
  allowedTools: ReadonlySet<string> | null,
): Promise<string[]> {
  if (!Array.isArray(tools)) {
    throw new McpGroupError(400, "tools must be an array of tool names");
  }

  const normalized = new Set<string>();
  for (const value of tools) {
    if (typeof value !== "string") {
      throw new McpGroupError(400, "tools must contain only strings");
    }
    const toolName = value.trim();
    if (!MCP_TOOL_NAME_REGEX.test(toolName)) {
      throw new McpGroupError(
        400,
        `tool "${toolName}" must match ^[a-zA-Z0-9_-]{1,64}$`,
      );
    }
    normalized.add(toolName);
  }

  if (allowedTools) {
    const disallowed = [...normalized].filter((name) =>
      !allowedTools.has(name)
    );
    if (disallowed.length > 0) {
      throw new McpGroupError(
        403,
        `tools not allowed for this group: ${disallowed.join(", ")}`,
      );
    }
  }

  const available = await getAvailableToolNameSet();
  const unknown = [...normalized].filter((name) => !available.has(name));
  if (unknown.length > 0) {
    throw new McpGroupError(
      400,
      `unknown tools: ${unknown.join(", ")}`,
    );
  }

  return [...normalized];
}

export async function listAvailableMcpTools(): Promise<AvailableMcpTool[]> {
  const tools: AvailableMcpTool[] = STATIC_TOOL_NAMES.map((name) => ({
    name,
    type: "built-in",
  }));
  for (const name of await getDynamicToolNames()) {
    tools.push({ name, type: "dynamic" });
  }
  return tools;
}

async function attachTools(
  groups: Array<Omit<McpGroup, "tools">>,
): Promise<McpGroup[]> {
  if (groups.length === 0) return [];

  const memberships = await getDb()("mcp_group_tools")
    .whereIn("group_id", groups.map((group) => group.id))
    .orderBy("tool_name");

  const toolsByGroup = new Map<string, string[]>();
  for (const membership of memberships) {
    const groupId = membership.group_id as string;
    const tools = toolsByGroup.get(groupId) || [];
    tools.push(membership.tool_name as string);
    toolsByGroup.set(groupId, tools);
  }

  return groups.map((group) => ({
    ...group,
    tools: toolsByGroup.get(group.id) || [],
  }));
}

export async function listMcpGroups(): Promise<McpGroupView[]> {
  const groups = await getDb()("mcp_groups")
    .select("id", "name", "jwt_token", "created_at", "updated_at")
    .orderBy("created_at", "desc");
  return (await attachTools(groups)).map(toMcpGroupView);
}

export async function getMcpGroup(id: string): Promise<McpGroup | null> {
  const group = await getDb()("mcp_groups")
    .where("id", id)
    .first();
  if (!group) return null;
  const [groupWithTools] = await attachTools([group]);
  return groupWithTools;
}

export async function createMcpGroup(
  input: { name: unknown; tools: unknown },
  allowedTools: ReadonlySet<string> | null = null,
): Promise<{ group: McpGroupView; token: string }> {
  const name = normalizeGroupName(input.name);
  const tools = await normalizeGroupTools(input.tools, allowedTools);
  const id = crypto.randomUUID();
  const token = await createMcpGroupToken({ id, name });

  try {
    await getDb().transaction(async (trx) => {
      await trx("mcp_groups").insert({
        id,
        name,
        jwt_token: token,
      });
      if (tools.length > 0) {
        await trx("mcp_group_tools").insert(
          tools.map((toolName) => ({ group_id: id, tool_name: toolName })),
        );
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new McpGroupError(409, `MCP group "${name}" already exists`);
    }
    throw error;
  }

  const group = await getMcpGroup(id);
  if (!group) {
    throw new McpGroupError(500, "Failed to load the created MCP group");
  }
  return { group: toMcpGroupView(group), token };
}

export async function updateMcpGroup(
  id: string,
  input: { name?: unknown; tools?: unknown },
  allowedTools: ReadonlySet<string> | null = null,
): Promise<McpGroupView> {
  const existing = await getMcpGroup(id);
  if (!existing) throw new McpGroupError(404, "MCP group not found");

  const name = input.name === undefined
    ? existing.name
    : normalizeGroupName(input.name);
  const tools = input.tools === undefined
    ? null
    : await normalizeGroupTools(input.tools, allowedTools);

  try {
    await getDb().transaction(async (trx) => {
      await trx("mcp_groups").where("id", id).update({
        name,
        updated_at: trx.fn.now(),
      });
      if (tools) {
        await trx("mcp_group_tools").where("group_id", id).del();
        if (tools.length > 0) {
          await trx("mcp_group_tools").insert(
            tools.map((toolName) => ({ group_id: id, tool_name: toolName })),
          );
        }
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new McpGroupError(409, `MCP group "${name}" already exists`);
    }
    throw error;
  }

  const updated = await getMcpGroup(id);
  if (!updated) throw new McpGroupError(404, "MCP group not found");
  return toMcpGroupView(updated);
}

export async function deleteMcpGroup(id: string): Promise<boolean> {
  const deleted = await getDb()("mcp_groups").where("id", id).del();
  return deleted > 0;
}

export async function resetMcpGroupToken(
  id: string,
): Promise<{ token: string }> {
  const group = await getMcpGroup(id);
  if (!group) throw new McpGroupError(404, "MCP group not found");

  const token = await createMcpGroupToken({ id: group.id, name: group.name });
  await getDb()("mcp_groups").where("id", id).update({
    jwt_token: token,
    updated_at: getDb().fn.now(),
  });
  return { token };
}

export async function removeToolFromMcpGroup(
  id: string,
  toolName: string,
): Promise<McpGroupView> {
  const group = await getMcpGroup(id);
  if (!group) throw new McpGroupError(404, "MCP group not found");
  if (!group.tools.includes(toolName)) {
    throw new McpGroupError(404, `Tool "${toolName}" is not in this group`);
  }

  await getDb().transaction(async (trx) => {
    await trx("mcp_group_tools")
      .where({ group_id: id, tool_name: toolName })
      .del();
    await trx("mcp_groups").where("id", id).update({
      updated_at: trx.fn.now(),
    });
  });

  const updated = await getMcpGroup(id);
  if (!updated) throw new McpGroupError(404, "MCP group not found");
  return toMcpGroupView(updated);
}

export async function authenticateMcpGroupToken(
  token: string,
): Promise<McpGroup | null> {
  const payload = await verifyMcpGroupToken(token);
  if (!payload) return null;

  const group = await getMcpGroup(payload.sub);
  if (!group || group.jwt_token !== token) return null;
  return group;
}
