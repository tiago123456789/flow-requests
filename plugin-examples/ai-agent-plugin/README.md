# AI Agent Plugin

Sends a prompt to a large language model through the OpenRouter API and keeps
a short rolling conversation history in a Redis (Upstash) session.

## What it is

This plugin acts as a conversational AI agent inside a flow. On each run it
appends the user prompt to a Redis list keyed by the session id, reads back the
last 10 messages, and sends them to OpenRouter together with the system prompt.
The assistant's reply is stored back in Redis and returned to the flow, so
subsequent runs in the same session keep their context.

Use it when a flow needs to generate text, answer questions, or maintain
context across multiple executions.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
AiAgentNode
```

- npm package: `ai-agent-plugin-flow-request`
- CDN (browser): https://unpkg.com/ai-agent-plugin-flow-request@1.1.0/dist/bundle.js
- CDN (server): https://unpkg.com/ai-agent-plugin-flow-request@1.1.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `AiAgentNode`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Description |
|---|---|---|---|
| `token` | text | yes | OpenRouter API token. Store it in an env var and reference it with `{{ state.envData.OPENROUTER_TOKEN }}`. |
| `model` | text | yes | OpenRouter model id, e.g. `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`. |
| `systemPrompt` | textarea | yes | System instruction that defines the agent's behaviour. |
| `userPrompt` | textarea | yes | The user message. Supports `{{ }}` expressions. |
| `sessionId` | text | yes | Session key used to store the conversation history in Redis. Use the same value to keep context between runs. |
| `redisUrl` | text | yes | Upstash Redis REST URL. |
| `redisToken` | text | yes | Upstash Redis REST token. |

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

## Example

```json
{
  "type": "AiAgentNode",
  "name": "askAgent",
  "setting": {
    "token": "{{ state.envData.OPENROUTER_TOKEN }}",
    "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "systemPrompt": "You are a helpful assistant.",
    "userPrompt": "Summarize this text: {{ steps.fetchDoc.output.data.text }}",
    "sessionId": "my-session",
    "redisUrl": "{{ state.envData.UPSTASH_REDIS_URL }}",
    "redisToken": "{{ state.envData.UPSTASH_REDIS_TOKEN }}"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- The OpenRouter token and the Redis credentials are sensitive — always keep
  them in environment variables.
- Conversation history is capped to the last 10 messages per session.
- Model availability, pricing, and rate limits are enforced by OpenRouter.

See `skill.md` for the machine-readable description used by AI agents.
