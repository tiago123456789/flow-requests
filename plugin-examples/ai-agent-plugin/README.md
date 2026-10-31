# AI Agent Plugin

Sends prompts to a large language model through OpenRouter, optionally connects
to remote MCP servers for tool calling, and can keep conversation history in
Redis (Upstash).

## What it is

This plugin acts as an AI agent inside a flow. When Redis is configured, it
loads the last 10 messages for the session, sends them to OpenRouter, and stores
the exchange for later executions. Without a Redis URL, execution is stateless:
the node does not create a Redis client or session and sends only the current
system and user prompts.

Optionally, configure one or more remote Streamable HTTP MCP servers. The node
discovers their tools, exposes them to the OpenRouter model as function-calling
tools, executes requested MCP calls, and sends the results back to the model
until it produces a final response.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
AiAgentNode
```

- npm package: `ai-agent-plugin-flow-request`
- CDN (browser): https://unpkg.com/ai-agent-plugin-flow-request@1.2.0/dist/bundle.js
- CDN (server): https://unpkg.com/ai-agent-plugin-flow-request@1.2.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `AiAgentNode`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Description |
|---|---|---|---|
| `token` | text | yes | OpenRouter API token. Store it in an env var and reference it with `{{ this.state.envData.OPENROUTER_TOKEN }}`. |
| `model` | text | yes | OpenRouter model id, e.g. `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`. |
| `systemPrompt` | textarea | yes | System instruction that defines the agent's behaviour. |
| `userPrompt` | textarea | yes | The user message. Supports `{{ }}` expressions. |
| `mcpServersJson` | textarea | no | Optional JSON configuration for remote Streamable HTTP MCP servers and request headers. |
| `redisUrl` | text | no | Upstash Redis REST URL. Omit it to disable conversation history and run statelessly. |
| `redisToken` | text | conditional | Required only when `redisUrl` is provided. Store it in an env var. |
| `sessionId` | text | conditional | Required only when `redisUrl` is provided. Reuse it to keep context between runs. |

### Remote MCP tools

`mcpServersJson` accepts an object with an `mcpServers` map. Each entry has a
remote Streamable HTTP endpoint URL and optional string-valued request headers.
The headers support Flow Requests expressions, so credentials can come from
environment variables:

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

Use the server's `api-key` header for a Flow Requests remote MCP server. The
configured server name prefixes discovered tool names sent to the model,
avoiding collisions when multiple servers expose tools with the same name.
MCP servers are connected for the current execution and closed afterward.

## Output

On success, the full OpenRouter chat completion response is returned in `data`.
The answer text is at `data.choices[0].message.content`.

```json
{ "ok": true, "data": { "choices": [ { "message": { "content": "..." } } ] } }
```

On failure:

```json
{ "ok": false, "error": "..." }
```

## Example flow node

This MCP-enabled example omits Redis, so every run is stateless:

```json
{
  "type": "AiAgentNode",
  "name": "askMcpAgent",
  "setting": {
    "token": "{{ this.state.envData.OPENROUTER_TOKEN }}",
    "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "systemPrompt": "You are a helpful assistant. Use the available tools when needed.",
    "userPrompt": "Find the flow with ID 42 and summarize its status.",
    "mcpServersJson": "{\"mcpServers\":{\"flowRequests\":{\"url\":\"https://your-flow-server.example.com/mcp\",\"headers\":{\"api-key\":\"{{ this.state.envData.MCP_API_KEY }}\"}}}}"
  }
}
```

To enable history, provide `redisUrl`, `redisToken`, and `sessionId` together.
The complete browser flow-builder clipboard payload is in
[`mcp-agent-flow.json`](./mcp-agent-flow.json). Set `OPENROUTER_API_KEY`,
`MCP_API_KEY`, and the endpoint URL for your own MCP server before running it.

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- Keep the OpenRouter token, MCP server credentials, and Redis credentials in
  environment variables rather than hardcoding them.
- Conversation history is capped to the last 10 messages per session when Redis
  is enabled.
- MCP tool calling is limited to 8 consecutive tool rounds per execution.
- Model availability, pricing, and rate limits are enforced by OpenRouter.

See `skill.md` for the machine-readable description used by AI agents.
