import axios from "xior";
import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";
import { Redis } from "@upstash/redis";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  formatMcpToolResult,
  parseMcpServersConfig,
  registerMcpTools,
  type McpServersConfig,
  type McpToolClient,
} from "./mcp-tools";

const MAX_TOOL_ROUNDS = 8;

type ChatMessage = Record<string, any>;

type ConnectedMcpServer = {
  client: Client;
  transport: StreamableHTTPClientTransport;
};

class AiAgentNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "AiAgentNode",
      type: "AiAgentNode",
      description: "AI Agent plugin using OpenRouter with optional remote MCP tools",
      properties: [
        {
          label: "OpenRouter API Token",
          name: "token",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "Your OpenRouter API token used to authenticate requests to the language model service.",
        },
        {
          label: "LLM Model",
          name: "model",
          type: "text",
          required: true,
          default: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
          // @ts-ignore
          info: "OpenRouter model identifier for the language model that will generate the response.",
        },
        {
          label: "System Prompt",
          name: "systemPrompt",
          type: "textarea",
          required: true,
          default: null,
          // @ts-ignore
          info: "Instructions that define the assistant's role, behavior, and response constraints.",
        },
        {
          label: "User Prompt",
          name: "userPrompt",
          type: "textarea",
          required: true,
          default: null,
          // @ts-ignore
          info: "User message or question to send to the assistant. Supports Flow Requests expressions.",
        },
        {
          label: "MCP Servers (JSON)",
          name: "mcpServersJson",
          type: "textarea",
          required: false,
          default: null,
          // @ts-ignore
          info: 'Optional remote Streamable HTTP MCP configuration. Provide JSON with an "mcpServers" object containing server URLs and optional headers.',
        },
        {
          label: "Session id (optional; enables Redis conversation history)",
          name: "sessionId",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Identifier used to store and retrieve conversation history when Redis is enabled.",
        },
        {
          label: "Redis URL (optional; omit for stateless runs)",
          name: "redisUrl",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Optional Upstash Redis HTTP URL. When blank, this node does not create or load a conversation session.",
        },
        {
          label: "Redis token (required when Redis URL is provided)",
          name: "redisToken",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Authentication token for Redis. Required only when redisUrl is set; keep it secret and prefer an environment variable.",
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    if (
      node.settings?.mcpServersJson !== undefined &&
      node.settings.mcpServersJson !== null &&
      typeof node.settings.mcpServersJson !== "string"
    ) {
      node.settings.mcpServersJson = JSON.stringify(node.settings.mcpServersJson);
    }

    const setting = node.settings ?? {};

    const token = this.resolveRequired(setting.token, "OpenRouter API token");
    const model = this.resolveRequired(setting.model, "LLM model");
    const systemPrompt = this.resolveRequired(setting.systemPrompt, "system prompt");
    const userPrompt = this.resolveRequired(setting.userPrompt, "user prompt");
    const redisUrl = this.resolveOptional(setting.redisUrl);
    const redisToken = this.resolveOptional(setting.redisToken);
    const sessionId = this.resolveOptional(setting.sessionId);

    let redis: Redis | undefined;
    let cacheKey: string | undefined;
    if (redisUrl) {
      if (!redisToken) {
        throw new Error(
          "AiAgentNode: Redis token is required when a Redis URL is provided."
        );
      }
      if (!sessionId) {
        throw new Error(
          "AiAgentNode: Session id is required when a Redis URL is provided."
        );
      }
      redis = new Redis({ url: redisUrl, token: redisToken });
      cacheKey = `key:${sessionId}`;
    }

    let mcpConfigJson: string | undefined;
    if (setting.mcpServersJson !== undefined && setting.mcpServersJson !== null) {
      mcpConfigJson = this.parseExpression(String(setting.mcpServersJson));
    }

    let mcpServersConfig: McpServersConfig;
    try {
      mcpServersConfig = parseMcpServersConfig(mcpConfigJson);
    } catch (error) {
      throw new Error(
        `AiAgentNode: ${error instanceof Error ? error.message : "Invalid MCP configuration."}`
      );
    }

    const connectedServers: ConnectedMcpServer[] = [];
    const messagesToPersist: ChatMessage[] = [];

    try {
      const serversWithTools: Array<{
        name: string;
        client: McpToolClient;
        tools: Array<{
          name: string;
          description?: string | undefined;
          inputSchema?: Record<string, unknown> | undefined;
        }>;
      }> = [];

      for (const [serverName, serverConfig] of Object.entries(mcpServersConfig)) {
        const client = new Client(
          { name: "openrouter-mcp-bridge", version: "1.0.0" },
          { capabilities: {} }
        );
        const transport = new StreamableHTTPClientTransport(
          new URL(serverConfig.url),
          serverConfig.headers
            ? { requestInit: { headers: serverConfig.headers } }
            : undefined
        );
        connectedServers.push({ client, transport });

        await client.connect(transport);
        const response = await client.listTools();
        serversWithTools.push({
          name: serverName,
          client: client as unknown as McpToolClient,
          tools: response.tools,
        });
      }

      const { tools, registry } = registerMcpTools(serversWithTools);
      const previousMessages = redis && cacheKey
        ? await redis.lrange<ChatMessage>(cacheKey, -10, -1)
        : [];
      const userMessage: ChatMessage = { role: "user", content: userPrompt };
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...previousMessages,
        userMessage,
      ];
      messagesToPersist.push(userMessage);

      let completion: any;
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            messages,
            ...(tools.length > 0 ? { tools } : {}),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        completion = response.data;
        const responseMessage = completion?.choices?.[0]?.message;
        if (!responseMessage) {
          throw new Error("OpenRouter returned an empty assistant response.");
        }

        const toolCalls = Array.isArray(responseMessage.tool_calls)
          ? responseMessage.tool_calls
          : [];
        if (toolCalls.length === 0) {
          messages.push(responseMessage);
          messagesToPersist.push(responseMessage);
          break;
        }

        messages.push(responseMessage);
        messagesToPersist.push(responseMessage);
        for (const toolCall of toolCalls) {
          const functionName = toolCall?.function?.name;
          const toolCallId = toolCall?.id;
          const registeredTool =
            typeof functionName === "string" ? registry.get(functionName) : undefined;

          let content: string;
          if (!registeredTool) {
            content = `Unknown MCP tool: ${String(functionName ?? "(missing name)")}`;
          } else {
            try {
              const parsedArguments = JSON.parse(
                toolCall.function.arguments || "{}"
              ) as unknown;
              if (
                typeof parsedArguments !== "object" ||
                parsedArguments === null ||
                Array.isArray(parsedArguments)
              ) {
                throw new Error("Tool arguments must be a JSON object.");
              }

              const result = await registeredTool.client.callTool({
                name: registeredTool.originalName,
                arguments: parsedArguments as Record<string, unknown>,
              });
              content = formatMcpToolResult(result);
            } catch (error) {
              content = `MCP tool error: ${error instanceof Error ? error.message : String(error)}`;
            }
          }

          const toolMessage: ChatMessage = {
            role: "tool",
            tool_call_id: toolCallId,
            name: functionName,
            content,
          };
          messages.push(toolMessage);
          messagesToPersist.push(toolMessage);
        }

        if (round === MAX_TOOL_ROUNDS - 1) {
          throw new Error(
            `The assistant exceeded the maximum of ${MAX_TOOL_ROUNDS} MCP tool rounds.`
          );
        }
      }

      if (redis && cacheKey) {
        for (const message of messagesToPersist) {
          await redis.rpush(cacheKey, message);
        }
      }

      return { ok: true, data: completion?.choices[0]?.message?.content };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown AI agent error.",
      };
    } finally {
      await Promise.allSettled(
        connectedServers.map(({ client }) => client.close())
      );
    }
  }

  private resolveRequired(value: unknown, label: string): string {
    if (value === undefined || value === null || value === "") {
      throw new Error(`AiAgentNode: You need to provide a ${label}.`);
    }
    const resolved = this.parseExpression(String(value)).trim();
    if (!resolved) throw new Error(`AiAgentNode: You need to provide a ${label}.`);
    return resolved;
  }

  private resolveOptional(value: unknown): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const resolved = this.parseExpression(String(value)).trim();
    return resolved.length > 0 ? resolved : undefined;
  }
}

export default AiAgentNode;
