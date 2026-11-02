# Skill: AI Agent Plugin

**Name:** AiAgentNode
**Version:** 1.2.0
**npm package:** ai-agent-plugin-flow-request
**CDN (browser):** https://unpkg.com/ai-agent-plugin-flow-request@1.2.0/dist/bundle.js
**CDN (server):** https://unpkg.com/ai-agent-plugin-flow-request@1.2.0/dist/deno-bundle.js
**Library name:** AiAgentNode

---

## Description

Sends prompts to an LLM available on [OpenRouter](https://openrouter.ai),
optionally connects to remote MCP servers for tool calling, and optionally
maintains per-session conversation history in [Upstash Redis](https://upstash.com/redis).

When Redis is configured, each execution loads the last 10 messages for the
`sessionId`, sends them with the system prompt to OpenRouter, and stores the
exchange for subsequent runs. When `redisUrl` is blank, execution is stateless:
the node does not construct a Redis client or create a session, and sends only
the current system and user prompts.

When `mcpServersJson` is configured, the node connects to each remote
Streamable HTTP MCP server, discovers its tools, converts them to OpenRouter
function tools, executes requested calls, and returns results to the model
until a final response is produced.

Use this node whenever a flow needs an AI agent. Add Redis settings when it
needs to remember previous interactions; leave Redis unset for stateless
prompt-and-response runs. It also supports tool use through remote MCP servers.

---

## When to use this plugin

- Build a multi-turn chatbot that remembers the last 10 messages per user session.
- Pass scraped web content (from a Firecrawl node) into an LLM for summarisation.
- Generate structured output (JSON, Markdown) from unstructured text using a system prompt.
- Chain multiple AI nodes with different system prompts for staged reasoning.
- Implement a Q&A assistant that stores conversation history per user ID.
- Let an agent discover and invoke tools from one or more remote MCP servers.

---

## Node properties (settings)

| Property name  | Type     | Required | Default | Description |
|----------------|----------|----------|---------|-------------|
| `token`        | text     | yes      | —       | OpenRouter API key. Store in env and reference with `{{ this.state.envData.OPENROUTER_API_KEY }}`. |
| `model`        | text     | yes      | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | OpenRouter model identifier. Any model slug from [openrouter.ai/models](https://openrouter.ai/models) is valid. |
| `systemPrompt` | textarea | yes      | —       | Instructions that define the agent's role and behaviour. Sent as the `system` message on every call. |
| `userPrompt`   | textarea | yes      | —       | The current user message. Supports `{{ }}` expressions. |
| `mcpServersJson` | textarea | no     | —       | JSON containing an `mcpServers` object with remote Streamable HTTP URLs and optional headers. |
| `redisUrl`     | text     | no       | —       | Optional Upstash Redis HTTP URL. Leave blank to disable Redis and run statelessly. |
| `redisToken`   | text     | conditional | —    | Required only when `redisUrl` is provided. Store it in an environment variable. |
| `sessionId`    | text     | conditional | —    | Required only when `redisUrl` is provided. Messages are stored under `key:<sessionId>`. |

### Remote MCP configuration

`mcpServersJson` must be JSON text using this shape. Each endpoint must use
HTTP or HTTPS and implement MCP Streamable HTTP. Header values support Flow
Requests expressions; use environment variables for credentials.

```json
{
  "mcpServers": {
    "flowRequests": {
      "url": "https://your-flow-server.example.com/mcp",
      "headers": {
        "api-key": "{{ this.state.envData.MCP_API_KEY }}"
      }
    }
  }
}
```

Tools are exposed to the model as `mcp_<server-name>_<tool-name>` function
names. Characters other than letters, digits, `_`, and `-` are replaced with
`_`; names are kept within the provider's 64-character limit. The original
MCP tool name is used when calling the server. Connections are closed after
each node execution.

### Choosing a model

Common free models available on OpenRouter:

| Model slug | Notes |
|------------|-------|
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | Default. Fast reasoning model. |
| `mistralai/mistral-7b-instruct:free` | Lightweight, general purpose. |
| `google/gemma-3-27b-it:free` | Google Gemma 3 instruction-tuned. |
| `meta-llama/llama-3.1-8b-instruct:free` | Meta Llama 3.1, good for chat. |

See the full list at [openrouter.ai/models](https://openrouter.ai/models).

---

## Output shape

Success:
```json
{
  "ok": true,
  "data": {
    "id": "gen-xxxx",
    "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "The assistant's reply text."
        },
        "finish_reason": "stop",
        "index": 0
      }
    ],
    "usage": {
      "prompt_tokens": 120,
      "completion_tokens": 85,
      "total_tokens": 205
    }
  }
}
```

`data` is the full OpenRouter `/chat/completions` response object.

Failure:
```json
{
  "ok": false,
  "error": "Request failed with status 401"
}
```

---

## How to reference output in downstream nodes

```
{{ steps.aiNode.output.ok }}                                    — boolean, true on success
{{ steps.aiNode.output.data.choices[0].message.content }}       — the assistant's reply text
{{ steps.aiNode.output.data.model }}                            — model used
{{ steps.aiNode.output.data.usage.total_tokens }}               — total tokens consumed
{{ steps.aiNode.output.error }}                                 — error message on failure
```

---

## Example flow snippets

Question-answering agent with Redis conversation history:

```json
{
  "type": "AiAgentNode",
  "name": "qa",
  "setting": {
    "token": "{{ this.state.envData.OPENROUTER_API_KEY }}",
    "model": "mistralai/mistral-7b-instruct:free",
    "systemPrompt": "You are a helpful assistant. Answer concisely.",
    "userPrompt": "{{ steps.inputNode.output.data.question }}",
    "sessionId": "{{ steps.inputNode.output.data.userId }}",
    "redisUrl": "{{ this.state.envData.UPSTASH_REDIS_URL }}",
    "redisToken": "{{ this.state.envData.UPSTASH_REDIS_TOKEN }}"
  }
}
```

Stateless agent using a remote MCP server:

```json
{
  "type": "AiAgentNode",
  "name": "askMcpAgent",
  "setting": {
    "token": "{{ this.state.envData.OPENROUTER_API_KEY }}",
    "model": "mistralai/mistral-7b-instruct:free",
    "systemPrompt": "You are a helpful assistant. Use tools when needed.",
    "userPrompt": "Find the flow with ID 42 and summarize its status.",
    "mcpServersJson": "{\"mcpServers\":{\"flowRequests\":{\"url\":\"https://your-flow-server.example.com/mcp\",\"headers\":{\"api-key\":\"{{ this.state.envData.MCP_API_KEY }}\"}}}}"
  }
}
```

No Redis settings are supplied above, so no session is created and no history
is retained. To enable history, provide `redisUrl`, `redisToken`, and
`sessionId` together.

Summarise scraped web content:

```json
{
  "type": "AiAgentNode",
  "name": "summarise",
  "setting": {
    "token": "{{ this.state.envData.OPENROUTER_API_KEY }}",
    "model": "meta-llama/llama-3.1-8b-instruct:free",
    "systemPrompt": "Summarise the following web page content in 3 bullet points.",
    "userPrompt": "{{ steps.scrapeNode.output.data.result }}",
    "sessionId": "summary-session-001",
    "redisUrl": "{{ this.state.envData.UPSTASH_REDIS_URL }}",
    "redisToken": "{{ this.state.envData.UPSTASH_REDIS_TOKEN }}"
  }
}
```

---

## Constraints and caveats

- **All credentials are sensitive** — store `OPENROUTER_API_KEY`,
  MCP request-header credentials, `UPSTASH_REDIS_URL`, and
  `UPSTASH_REDIS_TOKEN` in the flow's environment variables. Never hardcode
  them.
- **History window is fixed at 10 messages** — the plugin retrieves the last
  10 messages from Redis (`lrange key -10 -1`). Older messages are retained in
  Redis but not sent to the model.
- **Redis is opt-in** — when `redisUrl` is empty, there is no Redis client,
  session, or persisted history. When enabled, `redisToken` and `sessionId` are
  required; history is stored under `key:<sessionId>`. Use unique session IDs.
- **System prompt is not stored in history** — the system prompt is sent fresh
  on every call and is not appended to the Redis list.
- **Token costs** — each call consumes input tokens for the system prompt plus
  the last 10 history messages plus the new user prompt. Long histories or
  large system prompts will increase per-call token usage.
- **Model availability** — free models on OpenRouter may have rate limits or
  periodic downtime. Check [openrouter.ai/models](https://openrouter.ai/models)
  for current status and context-window sizes.
- **No streaming** — the plugin uses a standard (non-streaming) completion
  request. The full response is returned at once when the model finishes.
- **Tool round limit** — an execution allows at most 8 consecutive model/MCP
  tool rounds.
