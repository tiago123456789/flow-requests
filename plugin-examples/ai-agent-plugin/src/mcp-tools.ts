export type McpServerConfig = {
  url: string;
  headers?: Record<string, string>;
};

export type McpServersConfig = Record<string, McpServerConfig>;

export type ListedMcpTool = {
  name: string;
  description?: string | undefined;
  inputSchema?: Record<string, unknown> | undefined;
};

export type McpToolClient = {
  callTool(input: {
    name: string;
    arguments: Record<string, unknown>;
  }): Promise<unknown>;
};

export type OpenRouterFunctionTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type RegisteredMcpTool = {
  client: McpToolClient;
  originalName: string;
};

export function parseMcpServersConfig(value: unknown): McpServersConfig {
  if (value === undefined || value === null || value === "") return {};
  if (typeof value !== "string") {
    throw new Error("MCP servers configuration must be valid JSON text.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("MCP servers configuration contains invalid JSON.");
  }

  if (!isRecord(parsed) || !isRecord(parsed.mcpServers)) {
    throw new Error(
      'MCP servers configuration must contain an "mcpServers" object.'
    );
  }

  const result: McpServersConfig = {};
  for (const [serverName, rawConfig] of Object.entries(parsed.mcpServers)) {
    if (!serverName.trim() || !isRecord(rawConfig)) {
      throw new Error("Each MCP server must have a name and an object config.");
    }

    if (typeof rawConfig.url !== "string" || !rawConfig.url.trim()) {
      throw new Error(`MCP server "${serverName}" must have a URL.`);
    }

    let url: URL;
    try {
      url = new URL(rawConfig.url);
    } catch {
      throw new Error(`MCP server "${serverName}" has an invalid URL.`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(
        `MCP server "${serverName}" URL must use HTTP or HTTPS.`
      );
    }

    let headers: Record<string, string> | undefined;
    if (rawConfig.headers !== undefined) {
      if (!isRecord(rawConfig.headers)) {
        throw new Error(
          `MCP server "${serverName}" headers must be a JSON object.`
        );
      }
      headers = {};
      for (const [headerName, headerValue] of Object.entries(rawConfig.headers)) {
        if (typeof headerValue !== "string") {
          throw new Error(
            `MCP server "${serverName}" header "${headerName}" must be a string.`
          );
        }
        headers[headerName] = headerValue;
      }
    }

    result[serverName] = { url: url.toString(), ...(headers ? { headers } : {}) };
  }

  return result;
}

export function registerMcpTools(
  servers: Array<{
    name: string;
    client: McpToolClient;
    tools: ListedMcpTool[];
  }>
): {
  tools: OpenRouterFunctionTool[];
  registry: Map<string, RegisteredMcpTool>;
} {
  const tools: OpenRouterFunctionTool[] = [];
  const registry = new Map<string, RegisteredMcpTool>();

  for (const server of servers) {
    for (const tool of server.tools) {
      const baseName = `mcp_${server.name}_${tool.name}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      let functionName = baseName.slice(0, 64) || "mcp_tool";
      let suffix = 2;
      while (registry.has(functionName)) {
        const suffixText = `_${suffix++}`;
        functionName = `${baseName.slice(0, 64 - suffixText.length)}${suffixText}`;
      }

      const schema =
        tool.inputSchema && isRecord(tool.inputSchema)
          ? tool.inputSchema
          : { type: "object", properties: {} };

      tools.push({
        type: "function",
        function: {
          name: functionName,
          description: tool.description || `Runs MCP tool ${tool.name}`,
          parameters: schema,
        },
      });
      registry.set(functionName, {
        client: server.client,
        originalName: tool.name,
      });
    }
  }

  return { tools, registry };
}

export function formatMcpToolResult(result: unknown): string {
  if (!isRecord(result)) return serialize(result);

  const content = Array.isArray(result.content) ? result.content : [];
  const textContent = content
    .map((item) => {
      if (isRecord(item) && item.type === "text" && typeof item.text === "string") {
        return item.text;
      }
      return serialize(item);
    })
    .filter(Boolean);

  if (textContent.length > 0) return textContent.join("\n");
  if (result.structuredContent !== undefined) {
    return serialize(result.structuredContent);
  }
  return serialize(result);
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serialize(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
