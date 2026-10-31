import { normalizeBaseUrl } from "@/hooks/useRemoteConfig";
import type {
  AvailableMcpTool,
  CreateMcpGroupResponse,
  McpGroup,
  ResetMcpGroupTokenResponse,
} from "@/types/mcp-group";

export class McpGroupsApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "McpGroupsApiError";
  }
}

async function request<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) {
    throw new McpGroupsApiError(0, "Endpoint (API URL) is required");
  }
  if (!apiKey.trim()) {
    throw new McpGroupsApiError(0, "API key is required");
  }

  const response = await fetch(`${normalized}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new McpGroupsApiError(
      response.status,
      body?.error || `Request failed with status ${response.status}`
    );
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function fetchAvailableMcpTools(
  baseUrl: string,
  apiKey: string
): Promise<AvailableMcpTool[]> {
  const data = await request<{ tools?: AvailableMcpTool[] }>(
    baseUrl,
    apiKey,
    "/mcp-tools"
  );
  return data.tools ?? [];
}

export async function fetchMcpGroups(
  baseUrl: string,
  apiKey: string
): Promise<McpGroup[]> {
  const data = await request<{ groups?: McpGroup[] }>(
    baseUrl,
    apiKey,
    "/mcp-groups"
  );
  return data.groups ?? [];
}

export function createMcpGroup(
  baseUrl: string,
  apiKey: string,
  input: { name: string; tools: string[] }
): Promise<CreateMcpGroupResponse> {
  return request<CreateMcpGroupResponse>(baseUrl, apiKey, "/mcp-groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMcpGroup(
  baseUrl: string,
  apiKey: string,
  id: string,
  input: { name: string; tools: string[] }
): Promise<McpGroup> {
  const data = await request<{ group: McpGroup }>(
    baseUrl,
    apiKey,
    `/mcp-groups/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );
  return data.group;
}

export async function deleteMcpGroup(
  baseUrl: string,
  apiKey: string,
  id: string
): Promise<void> {
  await request<{ deleted: boolean }>(
    baseUrl,
    apiKey,
    `/mcp-groups/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export function resetMcpGroupToken(
  baseUrl: string,
  apiKey: string,
  id: string
): Promise<ResetMcpGroupTokenResponse> {
  return request<ResetMcpGroupTokenResponse>(
    baseUrl,
    apiKey,
    `/mcp-groups/${encodeURIComponent(id)}/reset-token`,
    { method: "POST" }
  );
}

export async function removeMcpGroupTool(
  baseUrl: string,
  apiKey: string,
  id: string,
  toolName: string
): Promise<McpGroup> {
  const data = await request<{ group: McpGroup }>(
    baseUrl,
    apiKey,
    `/mcp-groups/${encodeURIComponent(id)}/tools/${encodeURIComponent(toolName)}`,
    { method: "DELETE" }
  );
  return data.group;
}
