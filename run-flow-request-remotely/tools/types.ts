import type {
  McpServer,
  RegisteredTool,
} from "npm:@modelcontextprotocol/sdk/server/mcp.js";

export type CreateLoggedTool = (
  toolName: string,
  handler: (args: any) => Promise<any>,
) => (args: any) => Promise<any>;

export type ToolContext = {
  allowedTools: ReadonlySet<string> | null;
};

export type ToolRegistrar = (
  mcpServer: McpServer,
  createLoggedTool: CreateLoggedTool,
  context: ToolContext,
) => RegisteredTool;
