export type McpToolType = "built-in" | "dynamic";

export interface AvailableMcpTool {
  name: string;
  type: McpToolType;
}

export interface McpGroup {
  id: string;
  name: string;
  tools: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateMcpGroupResponse {
  group: McpGroup;
  token: string;
}

export interface ResetMcpGroupTokenResponse {
  token: string;
}
