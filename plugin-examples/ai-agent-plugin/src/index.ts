import axios from "xior";
import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

import { Redis } from "@upstash/redis";


class AiAgentNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "AiAgentNode",
      type: "AiAgentNode",
      description: "AI Agent plugin using OpenRouter API",
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
          label: "Session id(To use the save the interactions user did)",
          name: "sessionId",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "Identifier used to store and retrieve conversation history for the same user or session.",
        },
        {
          label: "Redis URL(HTTP URL from Redis(Qstash))",
          name: "redisUrl",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "HTTP URL for the Redis database used to persist conversation history.",
        },
        {
          label: "Redis token(Qstash Redis token)",
          name: "redisToken",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "Authentication token for the Redis database. Keep it secret and prefer an environment variable.",
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;

    if (!setting.token) {
      throw new Error("You need to provide an OpenRouter API token");
    }

    if (!setting.model) {
      throw new Error("You need to provide a LLM model");
    }

    if (!setting.systemPrompt) {
      throw new Error("You need to provide a system prompt");
    }

    if (!setting.userPrompt) {
      throw new Error("You need to provide a user prompt");
    }

    if (!setting.sessionId) {
      throw new Error("You need to provide a session Id");
    }

    if (!setting.redisUrl) {
      throw new Error("You need to provide a Redis url");
    }

    if (!setting.redisToken) {
      throw new Error("You need to provide a Redis token");
    }

    const token = this.parseExpression(setting.token);
    const model = this.parseExpression(setting.model);
    const systemPrompt = this.parseExpression(setting.systemPrompt);
    const userPrompt = this.parseExpression(setting.userPrompt);
    const sessionId = this.parseExpression(setting.sessionId)
    const redisUrl = this.parseExpression(setting.redisUrl)
    const redisToken = this.parseExpression(setting.redisToken)

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    const cacheKey = `key:${sessionId}`
    await redis.rpush(cacheKey, { role: "user", content: userPrompt });
    const last10Messages: Array<{ [key: string]: any }> = await redis.lrange(cacheKey, -10, -1);
    console.log(last10Messages);
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...(last10Messages),
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await redis.rpush(cacheKey, { role: "system", content: JSON.stringify(response.data.choices[0]) });
      console.log(response.data.choices[0])
      return { ok: true, data: response.data };
    } catch (error: any) {
      console.log(error)
      return { ok: false, error: error.message };
    }
  }
}

export default AiAgentNode;
