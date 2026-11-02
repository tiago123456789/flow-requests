const mockPost = jest.fn();
const mockClientInstances: Array<Record<string, jest.Mock>> = [];
const mockRedisInstance = {
  lrange: jest.fn().mockResolvedValue([]),
  rpush: jest.fn().mockResolvedValue(1),
};

jest.mock("core-package-mini-n8n", () => ({
  NodeBase: class {
    parseExpression(value: string) {
      return value;
    }
  },
}));

jest.mock("xior", () => ({
  __esModule: true,
  default: { post: (...args: unknown[]) => mockPost(...args) },
}));

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => mockRedisInstance),
}));

jest.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: jest.fn().mockImplementation(() => {
    const client = {
      connect: jest.fn().mockResolvedValue(undefined),
      listTools: jest.fn().mockResolvedValue({
        tools: [
          {
            name: "lookup",
            description: "Look up a record",
            inputSchema: {
              type: "object",
              properties: { id: { type: "string" } },
              required: ["id"],
            },
          },
        ],
      }),
      callTool: jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "Found it." }],
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockClientInstances.push(client);
    return client;
  }),
}));

jest.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: jest.fn(),
}));

import { Redis } from "@upstash/redis";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import AiAgentNode from "../src/index";
import {
  formatMcpToolResult,
  parseMcpServersConfig,
  registerMcpTools,
} from "../src/mcp-tools";

describe("AiAgentNode", () => {
  const baseSettings = {
    token: "openrouter-token",
    model: "test-model",
    systemPrompt: "Be helpful.",
    userPrompt: "Hello",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientInstances.length = 0;
    mockRedisInstance.lrange.mockResolvedValue([]);
    mockRedisInstance.rpush.mockResolvedValue(1);
  });

  it("runs statelessly without constructing Redis when redisUrl is omitted", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        choices: [{ message: { role: "assistant", content: "Hi there." } }],
      },
    });

    const node = new AiAgentNode({});
    const result = await node.execute({ settings: baseSettings } as any);

    expect(result).toEqual({
      ok: true,
      data: "Hi there.",
    });
    expect(Redis).not.toHaveBeenCalled();
    expect(mockPost.mock.calls[0][1].messages.slice(0, 2)).toEqual([
      { role: "system", content: "Be helpful." },
      { role: "user", content: "Hello" },
    ]);
  });

  it("discovers MCP tools, executes tool calls, and returns the final model response", async () => {
    mockPost
      .mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call-1",
                    type: "function",
                    function: {
                      name: "mcp_flowRequests_lookup",
                      arguments: '{"id":"42"}',
                    },
                  },
                ],
              },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          choices: [
            { message: { role: "assistant", content: "The answer is 42." } },
          ],
        },
      });

    const node = new AiAgentNode({});
    const result = await node.execute({
      settings: {
        ...baseSettings,
        mcpServersJson: {
          mcpServers: {
            flowRequests: {
              url: "https://example.com/mcp",
              headers: { "api-key": "group-key" },
            },
          },
        },
      },
    } as any);

    expect(result).toEqual({
      ok: true,
      data: "The answer is 42.",
    });
    expect(mockClientInstances).toHaveLength(1);
    expect(mockClientInstances[0].connect).toHaveBeenCalledTimes(1);
    expect(mockClientInstances[0].listTools).toHaveBeenCalledTimes(1);
    expect(mockClientInstances[0].callTool).toHaveBeenCalledWith({
      name: "lookup",
      arguments: { id: "42" },
    });
    expect(mockClientInstances[0].close).toHaveBeenCalledTimes(1);
    expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
      new URL("https://example.com/mcp"),
      { requestInit: { headers: { "api-key": "group-key" } } }
    );

    const firstOpenRouterRequest = mockPost.mock.calls[0][1];
    expect(firstOpenRouterRequest.tools[0]).toEqual({
      type: "function",
      function: {
        name: "mcp_flowRequests_lookup",
        description: "Look up a record",
        parameters: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
    });
    expect(mockPost.mock.calls[1][1].messages.slice(-3, -1)).toEqual([
      expect.objectContaining({ role: "assistant", tool_calls: expect.any(Array) }),
      {
        role: "tool",
        tool_call_id: "call-1",
        name: "mcp_flowRequests_lookup",
        content: "Found it.",
      },
    ]);
    expect(Redis).not.toHaveBeenCalled();
  });

  it("persists the conversation only when Redis settings are configured", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        choices: [{ message: { role: "assistant", content: "Saved reply." } }],
      },
    });

    const node = new AiAgentNode({});
    const result = await node.execute({
      settings: {
        ...baseSettings,
        redisUrl: "https://redis.example.com",
        redisToken: "redis-token",
        sessionId: "session-1",
      },
    } as any);

    expect(result).toMatchObject({ ok: true });
    expect(Redis).toHaveBeenCalledWith({
      url: "https://redis.example.com",
      token: "redis-token",
    });
    expect(mockRedisInstance.lrange).toHaveBeenCalledWith("key:session-1", -10, -1);
    expect(mockRedisInstance.rpush).toHaveBeenCalledTimes(2);
  });
});

describe("MCP helpers", () => {
  it("validates remote server JSON and supports optional request headers", () => {
    expect(
      parseMcpServersConfig(
        JSON.stringify({
          mcpServers: {
            work: {
              url: "https://example.com/mcp",
              headers: { "api-key": "secret" },
            },
          },
        })
      )
    ).toEqual({
      work: {
        url: "https://example.com/mcp",
        headers: { "api-key": "secret" },
      },
    });
    expect(() => parseMcpServersConfig("{bad json")).toThrow("invalid JSON");
    expect(() => parseMcpServersConfig('{"mcpServers":{"local":{"url":"stdio://x"}}}'))
      .toThrow("must use HTTP or HTTPS");
  });

  it("namespaces MCP function definitions and formats text tool results", () => {
    const client = { callTool: jest.fn() };
    const registered = registerMcpTools([
      {
        name: "work-server",
        client,
        tools: [
          {
            name: "search.items",
            description: "Search items",
            inputSchema: { type: "object", properties: { query: { type: "string" } } },
          },
        ],
      },
    ]);

    expect(registered.tools[0].function.name).toBe("mcp_work-server_search_items");
    expect(registered.registry.get("mcp_work-server_search_items")).toEqual({
      client,
      originalName: "search.items",
    });
    expect(
      formatMcpToolResult({
        content: [{ type: "text", text: "First" }, { type: "text", text: "Second" }],
      })
    ).toBe("First\nSecond");
  });
});
