# Skill: AI Agent Plugin

**Name:** AiAgentNode
**Version:** 1.1.0
**npm package:** ai-agent-plugin-flow-request
**CDN (browser):** https://unpkg.com/ai-agent-plugin-flow-request@1.1.0/dist/bundle.js
**CDN (server):** https://unpkg.com/ai-agent-plugin-flow-request@1.1.0/dist/deno-bundle.js
**Library name:** AiAgentNode

---

## Description

Sends a prompt to any LLM available on [OpenRouter](https://openrouter.ai)
and maintains a per-session conversation history stored in
[Upstash Redis](https://upstash.com/redis).

Each execution appends the current user prompt to a Redis list keyed by
`sessionId`, retrieves the last 10 messages, and sends them together with
the system prompt to the OpenRouter `/chat/completions` endpoint. The
assistant's reply is then pushed back into the history list, enabling
multi-turn conversations across multiple flow executions.

Use this node whenever a flow needs a stateful AI agent that remembers
previous interactions — chatbots, summarization loops, multi-step reasoning
chains, or any workflow that builds context over time.

---

## When to use this plugin

- Build a multi-turn chatbot that remembers the last 10 exchanges per user session.
- Pass scraped web content (from a Firecrawl node) into an LLM for summarisation.
- Generate structured output (JSON, Markdown) from unstructured text using a system prompt.
- Chain multiple AI nodes with different system prompts for staged reasoning.
- Implement a Q&A assistant that stores conversation history per user ID.

---

## Node properties (settings)

| Property name  | Type     | Required | Default | Description |
|----------------|----------|----------|---------|-------------|
| `token`        | text     | yes      | —       | OpenRouter API key. Store in env and reference with `{{ state.envData.OPENROUTER_API_KEY }}`. |
| `model`        | text     | yes      | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | OpenRouter model identifier. Any model slug from [openrouter.ai/models](https://openrouter.ai/models) is valid. |
| `systemPrompt` | textarea | yes      | —       | Instructions that define the agent's role and behaviour. Sent as the `system` message on every call. |
| `userPrompt`   | textarea | yes      | —       | The current user message. Supports `{{ }}` expressions. |
| `sessionId`    | text     | yes      | —       | Unique identifier for the conversation session. Messages are stored under `key:<sessionId>` in Redis. |
| `redisUrl`     | text     | yes      | —       | Upstash Redis HTTP URL. Store in env: `{{ state.envData.UPSTASH_REDIS_URL }}`. |
| `redisToken`   | text     | yes      | —       | Upstash Redis REST token. Store in env: `{{ state.envData.UPSTASH_REDIS_TOKEN }}`. |

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

Simple question-answering agent:

```json
{
  "type": "AiAgentNode",
  "name": "qa",
  "setting": {
    "token": "{{ state.envData.OPENROUTER_API_KEY }}",
    "model": "mistralai/mistral-7b-instruct:free",
    "systemPrompt": "You are a helpful assistant. Answer concisely.",
    "userPrompt": "{{ steps.inputNode.output.data.question }}",
    "sessionId": "{{ steps.inputNode.output.data.userId }}",
    "redisUrl": "{{ state.envData.UPSTASH_REDIS_URL }}",
    "redisToken": "{{ state.envData.UPSTASH_REDIS_TOKEN }}"
  }
}
```

Summarise scraped web content:

```json
{
  "type": "AiAgentNode",
  "name": "summarise",
  "setting": {
    "token": "{{ state.envData.OPENROUTER_API_KEY }}",
    "model": "meta-llama/llama-3.1-8b-instruct:free",
    "systemPrompt": "Summarise the following web page content in 3 bullet points.",
    "userPrompt": "{{ steps.scrapeNode.output.data.result }}",
    "sessionId": "summary-session-001",
    "redisUrl": "{{ state.envData.UPSTASH_REDIS_URL }}",
    "redisToken": "{{ state.envData.UPSTASH_REDIS_TOKEN }}"
  }
}
```

---

## Constraints and caveats

- **All credentials are sensitive** — store `OPENROUTER_API_KEY`,
  `UPSTASH_REDIS_URL`, and `UPSTASH_REDIS_TOKEN` in the flow's environment
  variables. Never hardcode them.
- **History window is fixed at 10 messages** — the plugin retrieves the last
  10 messages from Redis (`lrange key -10 -1`). Older messages are retained in
  Redis but not sent to the model.
- **Redis key format** — history is stored under `key:<sessionId>`. Use unique,
  collision-free session IDs (e.g. a user ID or UUID) to avoid mixing
  conversation histories.
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
