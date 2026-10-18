# Skill: Create a New Flow in Flow Requests

**Name:** create-new-flow-flow-requests
**Description:** Reference for AI agents to generate valid Flow Requests automation flows in JSON format. Covers every native node type, the expression syntax, the dual data model, plugin nodes, and real-world composition patterns.

---

## 1. What is a Flow?

A **flow** is a JSON object that describes an automation workflow. When imported into Flow Requests (or executed by `run-flow-request-remotely`), the **WorkflowEngine** reads the `nodes` array as a linked list, instantiates each node in order, and passes accumulated `state` from node to node.

Flows are stored in an IndexedDB database on the client and are exported/imported as a top-level JSON envelope:

```json
{
  "plugins": [ ... ],
  "flows":   [ ... ]
}
```

- **`plugins`** — list of custom plugin registrations needed by the flows in this file.
- **`flows`** — list of flow objects.

---

## 2. Top-level flow object

```json
{
  "id": "1",
  "data": {
    "name": "My Flow Name",
    "triggerEvent": "start",
    "workflowId": "1",
    "contextVariables": [],
    "envData": [],
    "nodes": [ ... ],
    "originalWorkflow": {
      "nodes": [ ... ],
      "edges": [ ... ]
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier for the flow within the export file. Use a sequential number string. |
| `data.name` | string | yes | Human-readable display name shown in the UI sidebar. |
| `data.triggerEvent` | string | no | Always `"start"` when present. Can be omitted. |
| `data.workflowId` | string | no | Same value as `id`. Present in flows saved by the remote runner. |
| `data.contextVariables` | array | yes | Always `[]` (not used yet). |
| `data.envData` | array | yes | List of environment variable entries `{ key, value }`. |
| `data.nodes` | array | yes | **The execution node list** — what the engine actually runs. |
| `data.originalWorkflow` | object | yes | **The visual graph** — what React Flow renders in the UI. |

### `envData` entry

```json
{ "key": "MY_VAR", "value": "secret" }
```

Reference in expressions: `{{this.state.envData.MY_VAR}}`

---

## 3. The two parallel representations

Every flow has **two representations** that must be kept in sync:

| Representation | Field | Used by |
|---|---|---|
| Execution list | `data.nodes` | WorkflowEngine (runs the flow) |
| Visual graph | `data.originalWorkflow` | React Flow (renders the canvas) |

When an agent generates a flow it **must produce both**.

---

## 4. Execution node list (`data.nodes`)

The engine iterates `data.nodes` sequentially. Each node is a plain object:

```json
{
  "type": "<node-type>",
  "name": "<unique-name>",
  "setting": { ... },
  "input": {},
  "output": {}
}
```

- `type` — matches a built-in type (`start`, `api`, `condition`, `loop`, `code`) or a plugin's library name (e.g. `TelegramNode`, `AiAgentNode`).
- `name` — unique snake_case identifier for this node within the flow. Convention: `trigger_<lowercasedtype>_<1-based-position>` (e.g. `trigger_api_2`). Custom labels are allowed (e.g. `get_staff_stores`).
- `setting` — configuration values (see per-node sections below).
- `input` / `output` — always `{}` in stored flows; populated at runtime.

---

## 5. Native node types — execution format

### 5.1 `start`

Always the first node. No settings required.

```json
{
  "type": "start",
  "name": "trigger_start_1",
  "input": {},
  "output": {}
}
```

### 5.2 `api` — HTTP Request

```json
{
  "type": "api",
  "name": "trigger_api_2",
  "setting": {
    "method": "GET",
    "url": "https://api.example.com/resource",
    "headers": [
      { "key": "Authorization", "value": "Bearer {{this.state.envData.TOKEN}}" }
    ],
    "body": [
      { "key": "name", "value": "Alice" }
    ]
  },
  "input": {},
  "output": {}
}
```

| Setting | Type | Description |
|---|---|---|
| `method` | string | `GET`, `POST`, `PUT`, `DELETE` |
| `url` | string | Endpoint URL. Supports `{{ }}` expressions. |
| `headers` | array of `{key, value}` | HTTP headers. Use `[{}]` for none. |
| `body` | array of `{key, value}` | Key-value body pairs (sent as JSON). Use `[{}]` for none. |

**Output:** the API response body is stored flat in `this.state.steps.<name>.output`. If the API returns `{ "todos": [...] }`, access it as `{{this.state.steps.trigger_api_2.output.todos}}`.

### 5.3 `condition`

Branches the flow into `success` or `fail` paths based on a comparison.

```json
{
  "type": "condition",
  "name": "trigger_condition_3",
  "setting": {
    "condition": {
      "left":  { "type": "expression", "value": "{{this.state.steps.trigger_api_2.output.status}}" },
      "right": { "type": "raw",        "value": "200" },
      "operator": "=="
    },
    "success": [ ],
    "fail":    [ ]
  },
  "input": {},
  "output": {}
}
```

`left.type` / `right.type`:
- `"expression"` — the value contains a `this.state...` path.
- `"raw"` — a literal string or number.

Valid operators: `==`, `===`, `!=`, `>`, `<`, `>=`, `<=`

`success` and `fail` are **arrays of execution nodes** (same format as `data.nodes`). Nodes placed inside `success`/`fail` must NOT also appear in the top-level `data.nodes` array.

### 5.4 `loop`

Iterates over an array and runs a sub-list of nodes for each item.

```json
{
  "type": "loop",
  "name": "trigger_loop_3",
  "setting": {
    "source": "{{this.state.steps.trigger_api_2.output.todos}}",
    "nodes": [
      {
        "type": "api",
        "name": "trigger_api_4",
        "setting": {
          "method": "POST",
          "url": "https://webhook.site/my-hook",
          "headers": [{}],
          "body": [
            { "key": "item", "value": "{{this.state.steps.trigger_loop_3.currentItem}}" }
          ]
        },
        "input": {},
        "output": {}
      }
    ]
  },
  "input": {},
  "output": {}
}
```

- `setting.source` — expression resolving to an array.
- `setting.nodes` — nodes to execute **per iteration**.
- `{{this.state.steps.<loopName>.currentItem}}` — the current iteration item.

Nodes inside `setting.nodes` must NOT appear in the top-level `data.nodes` array.

### 5.5 `code`

Executes custom JavaScript. The code field is base64-encoded in the execution node (the UI encodes it before saving).

```json
{
  "type": "code",
  "name": "trigger_code_3",
  "setting": {
    "code": "<base64-encoded JS>",
    "params": null
  },
  "input": {},
  "output": {}
}
```

---

## 6. Plugin nodes — execution format

Plugin nodes use the plugin's **library name** as `type`. The `setting` object contains the plugin's configured property values plus the full `properties` array, `label`, `type`, `description`, `color`, `bgColor`, `borderColor`, `headers`, `body`, and `name` (these extra fields are what the frontend injects when saving a custom node and are needed for the UI to re-render the form).

```json
{
  "type": "TelegramNode",
  "name": "trigger_telegramnode_2",
  "setting": {
    "botToken": "{{this.state.envData.TELEGRAM_BOT_TOKEN}}",
    "chatId":   "{{this.state.envData.TELEGRAM_CHAT_ID}}",
    "message":  "Hello from Flow Requests!",
    "label": "TelegramNode",
    "type": "TelegramNode",
    "description": "Send messages via Telegram Bot API",
    "color": "text-blue-500",
    "bgColor": "bg-blue-50",
    "borderColor": "border-blue-200",
    "headers": [{}],
    "body": [{}],
    "name": "trigger_telegramnode_2",
    "properties": [
      { "label": "Bot Token", "name": "botToken", "type": "text", "required": true, "default": null },
      { "label": "Chat ID",   "name": "chatId",   "type": "text", "required": true, "default": null },
      { "label": "Message",   "name": "message",  "type": "text", "required": true, "default": null }
    ]
  },
  "input": {},
  "output": {}
}
```

---

## 7. Visual graph (`data.originalWorkflow`)

The `originalWorkflow` is what React Flow renders. It contains `nodes` (visual) and `edges` (connections).

### Visual node

```json
{
  "id": "2",
  "type": "api",
  "position": { "x": 250, "y": 250 },
  "data": {
    "label": "API",
    "name": "trigger_api_2",
    "endpoint": "https://api.example.com/resource",
    "method": "GET",
    "headers": [{}],
    "body": [{}],
    "type": "api",
    "description": "Make HTTP requests to external APIs",
    "color": "text-green-500",
    "bgColor": "bg-green-50",
    "borderColor": "border-green-200"
  },
  "width": 265,
  "height": 90,
  "selected": false,
  "positionAbsolute": { "x": 250, "y": 250 },
  "dragging": false
}
```

**Default sizes by type:**

| Type | width | height |
|---|---|---|
| start | 115 | 90 |
| api | 265 | 90 |
| condition | 265 | 90 |
| loop | 332 | 114 |
| Plugin nodes | 153 | 66 |

**Position layout guide:** Start at `{ x: 250, y: 100 }` for the Start node and increment `y` by ~150 for each subsequent node.

```
Start  -> y: 100
Node 2 -> y: 250
Node 3 -> y: 400
Node 4 -> y: 550
```

### Visual node `data` by type

**start:**
```json
{ "label": "Start", "name": "trigger_start_1" }
```

**api:**
```json
{
  "label": "API", "name": "trigger_api_2",
  "endpoint": "https://api.example.com/resource",
  "method": "GET", "headers": [{}], "body": [{}],
  "type": "api", "description": "Make HTTP requests to external APIs",
  "color": "text-green-500", "bgColor": "bg-green-50", "borderColor": "border-green-200"
}
```

**condition:**
```json
{
  "label": "Condition", "name": "trigger_condition_3",
  "condition": {
    "left": "{{this.state.steps.trigger_api_2.output.status}}",
    "operator": "==",
    "right": "200"
  },
  "trueLabel": "True", "falseLabel": "False",
  "type": "condition", "description": "Condition node",
  "color": "text-yellow-500", "bgColor": "bg-yellow-50", "borderColor": "border-yellow-200"
}
```

**loop:**
```json
{
  "label": "Loop", "name": "trigger_loop_3",
  "source": "{{this.state.steps.trigger_api_2.output.todos}}",
  "type": "loop", "description": "Execute actions multiple times over a list",
  "color": "text-blue-500", "bgColor": "bg-blue-50", "borderColor": "border-blue-200",
  "headers": [{}], "body": [{}]
}
```

**Plugin node (e.g. TelegramNode):**
```json
{
  "label": "TelegramNode", "name": "trigger_telegramnode_2", "type": "TelegramNode",
  "botToken": "{{this.state.envData.TELEGRAM_BOT_TOKEN}}",
  "chatId":   "{{this.state.envData.TELEGRAM_CHAT_ID}}",
  "message":  "Hello!",
  "description": "Send messages via Telegram Bot API",
  "color": "text-blue-500", "bgColor": "bg-blue-50", "borderColor": "border-blue-200",
  "headers": [{}], "body": [{}],
  "properties": [
    { "label": "Bot Token", "name": "botToken", "type": "text", "required": true, "default": null },
    { "label": "Chat ID",   "name": "chatId",   "type": "text", "required": true, "default": null },
    { "label": "Message",   "name": "message",  "type": "text", "required": true, "default": null }
  ]
}
```

### Edges

Standard edge:
```json
{
  "source": "1",
  "sourceHandle": null,
  "target": "2",
  "targetHandle": null,
  "id": "reactflow__edge-1-2"
}
```

Edge `id` format: `reactflow__edge-<sourceId>-<targetId>`

**Special edges:**

Loop body edge (loop node to its first child):
```json
{
  "source": "3", "sourceHandle": "loop",
  "target": "4", "targetHandle": null,
  "parentId": "3", "pathCondition": "loop",
  "id": "reactflow__edge-3loop-4"
}
```

Condition success edge:
```json
{
  "source": "3", "sourceHandle": "true",
  "target": "4", "targetHandle": null,
  "parentId": "3", "pathCondition": "true",
  "id": "reactflow__edge-3true-4"
}
```

Condition fail edge:
```json
{
  "source": "3", "sourceHandle": "false",
  "target": "5", "targetHandle": null,
  "parentId": "3", "pathCondition": "false",
  "id": "reactflow__edge-3false-5"
}
```

---

## 8. Expression syntax

All string values in `setting` fields support `{{ }}` template expressions. The engine resolves them via `eval()` against the live workflow `this.state`.

### State context paths

| Expression | What it resolves to |
|---|---|
| `{{this.state.steps.<nodeName>.output.<field>}}` | A field from a previous node's output |
| `{{this.state.steps.<nodeName>.output}}` | The entire output of a previous node |
| `{{this.state.steps.<loopName>.currentItem}}` | Current loop iteration item |
| `{{this.state.envData.<KEY>}}` | Environment variable |
| `{{this.state.request.body}}` | Incoming request body |
| `{{this.state.request.body.<field>}}` | A specific field from the request body |
| `{{this.state.request.headers.<name>}}` | A request header |
| `{{this.state.request.query.<param>}}` | A query string parameter |
| `{{this.state.faker.internet.email()}}` | Faker.js generated value |

**Syntax notes:**
- Always use the `this.state.` prefix. This is the canonical form used in all existing flows.
- Expressions can be embedded in strings: `"Bearer {{this.state.envData.TOKEN}}"`.
- If the resolved value is an object, it is JSON-stringified automatically.
- Deep bracket access works: `{{this.state.steps.myNode.output.data.choices[0].message.content}}`

### Faker.js categories available

`faker.person`, `faker.internet`, `faker.location`, `faker.company`, `faker.finance`, `faker.date`, `faker.lorem`, `faker.phone`, `faker.image`, `faker.animal`, `faker.vehicle`, `faker.commerce`, `faker.database`, `faker.music`, `faker.system`, `faker.science`, `faker.airline`, `faker.color`, `faker.git`, `faker.hacker`, `faker.helpers`, `faker.datatype`, `faker.random`, `faker.string`, `faker.number`.

---

## 9. Plugin registration (`plugins` array)

If a flow uses plugin nodes, the export envelope must include plugin registration entries:

```json
{
  "plugins": [
    {
      "enabled": true,
      "libraryName": "TelegramNode",
      "url": "https://unpkg.com/telegram-plugin-flow-requests@1.0.2/dist/bundle.js"
    }
  ],
  "flows": [ ... ]
}
```

### Discovering what a plugin does — `skill.md`

Every Flow Requests plugin ships a `skill.md` file alongside its bundle. This file is the authoritative reference for an AI agent: it describes the plugin's purpose, all node properties, the output shape, expression references, and usage examples.

**URL pattern to fetch a plugin's `skill.md`:**

Replace `/dist/bundle.js` at the end of the bundle URL with `/skill.md`:

```
Bundle URL:   https://unpkg.com/<package>@<version>/dist/bundle.js
skill.md URL: https://unpkg.com/<package>@<version>/skill.md
```

**Example — Telegram plugin:**

```
Bundle:    https://unpkg.com/telegram-plugin-flow-requests@1.0.2/dist/bundle.js
skill.md:  https://unpkg.com/telegram-plugin-flow-requests@1.0.2/skill.md
```

**When to fetch `skill.md`:**

Before wiring a plugin node into a flow, always fetch the plugin's `skill.md` to confirm:
- The exact property names to use in `setting`.
- The output shape (what keys are available in `this.state.steps.<name>.output`).
- Any constraints (rate limits, required env vars, server-only operations, etc.).

### Known community plugins

| libraryName | Bundle URL | skill.md URL |
|---|---|---|
| `TelegramNode` | `https://unpkg.com/telegram-plugin-flow-requests@1.0.2/dist/bundle.js` | `https://unpkg.com/telegram-plugin-flow-requests@1.0.2/skill.md` |
| `AiAgentNode` | `https://unpkg.com/ai-agent-plugin-flow-request@1.1.0/dist/bundle.js` | `https://unpkg.com/ai-agent-plugin-flow-request@1.1.0/skill.md` |
| `AlertMessage` | `https://unpkg.com/alert-message-plugin-flow-requests@1.4.0/dist/bundle.js` | `https://unpkg.com/alert-message-plugin-flow-requests@1.4.0/skill.md` |
| `PostgresNode` | `https://unpkg.com/pg-plugin-flow-requests@1.0.6/dist/bundle.js` | `https://unpkg.com/pg-plugin-flow-requests@1.0.6/skill.md` |
| `CodeNode` | `https://unpkg.com/code-plugin-flow-requests@latest/dist/bundle.js` | `https://unpkg.com/code-plugin-flow-requests@latest/skill.md` |

Note: The `telegram` type (lowercase) is a legacy alias found in older flows. Always use the exact PascalCase `libraryName` as `type` in new flows.

---

## 10. Built-in `CodeNode` plugin (type: `CodeNode`)

The CodeNode plugin runs JavaScript in a `node:vm` sandbox and accepts a `data` field whose values support `{{ }}` expressions.

```json
{
  "type": "CodeNode",
  "name": "trigger_codenode_3",
  "setting": {
    "code": "todos.filter(item => item.completed == true)",
    "data": "{ \"todos\": {{this.state.steps.trigger_api_2.output.todos}} }",
    "label": "CodeNode", "type": "CodeNode",
    "description": "Execute custom JavaScript against the provided data in an isolated node:vm sandbox",
    "color": "text-blue-500", "bgColor": "bg-blue-50", "borderColor": "border-blue-200",
    "headers": [{}], "body": [{}],
    "name": "trigger_codenode_3",
    "properties": [
      { "label": "Code",        "name": "code", "type": "textarea", "required": true,  "default": null },
      { "label": "Data (JSON)", "name": "data", "type": "textarea", "required": false, "default": null }
    ]
  },
  "input": {},
  "output": {}
}
```

- `code` — raw JavaScript expression evaluated in the sandbox context.
- `data` — a JSON string whose values support `{{ }}` expressions. The keys become local variables accessible in `code`.

---

## 11. Complete minimal flow template

```json
{
  "plugins": [],
  "flows": [
    {
      "id": "1",
      "data": {
        "name": "My Flow",
        "contextVariables": [],
        "envData": [],
        "nodes": [
          {
            "type": "start",
            "name": "trigger_start_1",
            "input": {},
            "output": {}
          }
        ],
        "originalWorkflow": {
          "nodes": [
            {
              "id": "1",
              "type": "start",
              "position": { "x": 250, "y": 100 },
              "data": { "label": "Start", "name": "trigger_start_1" },
              "width": 115, "height": 90,
              "selected": false,
              "positionAbsolute": { "x": 250, "y": 100 },
              "dragging": false
            }
          ],
          "edges": []
        }
      }
    }
  ]
}
```

---

## 12. Worked examples

### Example A — Simple GET then loop-forward each item

```json
{
  "plugins": [],
  "flows": [
    {
      "id": "1",
      "data": {
        "name": "Forward todos to webhook",
        "contextVariables": [],
        "envData": [],
        "nodes": [
          { "type": "start", "name": "trigger_start_1", "input": {}, "output": {} },
          {
            "type": "api", "name": "trigger_api_2",
            "setting": {
              "method": "GET", "url": "https://dummyjson.com/todos?limit=5",
              "headers": [{}], "body": [{}]
            },
            "input": {}, "output": {}
          },
          {
            "type": "loop", "name": "trigger_loop_3",
            "setting": {
              "source": "{{this.state.steps.trigger_api_2.output.todos}}",
              "nodes": [
                {
                  "type": "api", "name": "trigger_api_4",
                  "setting": {
                    "method": "POST", "url": "https://webhook.site/my-hook",
                    "headers": [{}],
                    "body": [{ "key": "todo", "value": "{{this.state.steps.trigger_loop_3.currentItem}}" }]
                  },
                  "input": {}, "output": {}
                }
              ]
            },
            "input": {}, "output": {}
          }
        ],
        "originalWorkflow": {
          "nodes": [
            {
              "id": "1", "type": "start",
              "position": { "x": 250, "y": 100 },
              "data": { "label": "Start", "name": "trigger_start_1" },
              "width": 115, "height": 90, "selected": false, "positionAbsolute": { "x": 250, "y": 100 }, "dragging": false
            },
            {
              "id": "2", "type": "api",
              "position": { "x": 150, "y": 250 },
              "data": {
                "label": "API", "name": "trigger_api_2",
                "endpoint": "https://dummyjson.com/todos?limit=5",
                "method": "GET", "headers": [{}], "body": [{}],
                "type": "api", "description": "Make HTTP requests to external APIs",
                "color": "text-green-500", "bgColor": "bg-green-50", "borderColor": "border-green-200"
              },
              "width": 265, "height": 90, "selected": false, "positionAbsolute": { "x": 150, "y": 250 }, "dragging": false
            },
            {
              "id": "3", "type": "loop",
              "position": { "x": 120, "y": 400 },
              "data": {
                "label": "Loop", "name": "trigger_loop_3",
                "source": "{{this.state.steps.trigger_api_2.output.todos}}",
                "type": "loop", "description": "Execute actions multiple times over a list",
                "color": "text-blue-500", "bgColor": "bg-blue-50", "borderColor": "border-blue-200",
                "headers": [{}], "body": [{}]
              },
              "width": 332, "height": 114, "selected": false, "positionAbsolute": { "x": 120, "y": 400 }, "dragging": false
            },
            {
              "id": "4", "type": "api",
              "position": { "x": 150, "y": 565 },
              "data": {
                "label": "API", "name": "trigger_api_4",
                "endpoint": "https://webhook.site/my-hook",
                "method": "POST", "headers": [{}],
                "body": [{ "key": "todo", "value": "{{this.state.steps.trigger_loop_3.currentItem}}" }],
                "type": "api", "description": "Make HTTP requests to external APIs",
                "color": "text-green-500", "bgColor": "bg-green-50", "borderColor": "border-green-200"
              },
              "width": 265, "height": 90, "selected": false, "positionAbsolute": { "x": 150, "y": 565 }, "dragging": false
            }
          ],
          "edges": [
            { "source": "1", "sourceHandle": null, "target": "2", "targetHandle": null, "id": "reactflow__edge-1-2" },
            { "source": "2", "sourceHandle": null, "target": "3", "targetHandle": null, "id": "reactflow__edge-2-3" },
            { "source": "3", "sourceHandle": "loop", "target": "4", "targetHandle": null, "parentId": "3", "pathCondition": "loop", "id": "reactflow__edge-3loop-4" }
          ]
        }
      }
    }
  ]
}
```

### Example B — Webhook trigger then AI agent then Telegram reply

```json
{
  "plugins": [
    { "enabled": true, "libraryName": "AiAgentNode", "url": "https://unpkg.com/ai-agent-plugin-flow-request@1.1.0/dist/bundle.js" },
    { "enabled": true, "libraryName": "TelegramNode", "url": "https://unpkg.com/telegram-plugin-flow-requests@1.0.2/dist/bundle.js" }
  ],
  "flows": [
    {
      "id": "1",
      "data": {
        "name": "AI chatbot via Telegram",
        "contextVariables": [],
        "envData": [
          { "key": "OPENROUTER_TOKEN", "value": "" },
          { "key": "TELEGRAM_BOT_TOKEN", "value": "" },
          { "key": "TELEGRAM_CHAT_ID", "value": "" }
        ],
        "nodes": [
          { "type": "start", "name": "trigger_start_1", "input": {}, "output": {} },
          {
            "type": "AiAgentNode", "name": "trigger_aiagentnode_2",
            "setting": {
              "token": "{{this.state.envData.OPENROUTER_TOKEN}}",
              "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
              "systemPrompt": "You are a helpful assistant.",
              "userPrompt": "{{this.state.request.body.message}}",
              "label": "AiAgentNode", "type": "AiAgentNode",
              "description": "AI Agent plugin using OpenRouter API",
              "color": "text-blue-500", "bgColor": "bg-blue-50", "borderColor": "border-blue-200",
              "headers": [{}], "body": [{}],
              "name": "trigger_aiagentnode_2",
              "properties": [
                { "label": "OpenRouter API Token", "name": "token",        "type": "text",     "required": true,  "default": null },
                { "label": "LLM Model",            "name": "model",        "type": "text",     "required": true,  "default": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
                { "label": "System Prompt",        "name": "systemPrompt", "type": "textarea", "required": true,  "default": null },
                { "label": "User Prompt",          "name": "userPrompt",   "type": "textarea", "required": true,  "default": null }
              ]
            },
            "input": {}, "output": {}
          },
          {
            "type": "TelegramNode", "name": "trigger_telegramnode_3",
            "setting": {
              "botToken": "{{this.state.envData.TELEGRAM_BOT_TOKEN}}",
              "chatId":   "{{this.state.envData.TELEGRAM_CHAT_ID}}",
              "message":  "{{this.state.steps.trigger_aiagentnode_2.output.data.choices[0].message.content}}",
              "label": "TelegramNode", "type": "TelegramNode",
              "description": "Send messages via Telegram Bot API",
              "color": "text-blue-500", "bgColor": "bg-blue-50", "borderColor": "border-blue-200",
              "headers": [{}], "body": [{}],
              "name": "trigger_telegramnode_3",
              "properties": [
                { "label": "Bot Token", "name": "botToken", "type": "text", "required": true, "default": null },
                { "label": "Chat ID",   "name": "chatId",   "type": "text", "required": true, "default": null },
                { "label": "Message",   "name": "message",  "type": "text", "required": true, "default": null }
              ]
            },
            "input": {}, "output": {}
          }
        ],
        "originalWorkflow": {
          "nodes": [
            {
              "id": "1", "type": "start",
              "position": { "x": 250, "y": 100 },
              "data": { "label": "Start", "name": "trigger_start_1" },
              "width": 115, "height": 90, "selected": false, "positionAbsolute": { "x": 250, "y": 100 }, "dragging": false
            },
            {
              "id": "2", "type": "AiAgentNode",
              "position": { "x": 236, "y": 250 },
              "data": {
                "label": "AiAgentNode", "name": "trigger_aiagentnode_2", "type": "AiAgentNode",
                "token": "{{this.state.envData.OPENROUTER_TOKEN}}",
                "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
                "systemPrompt": "You are a helpful assistant.",
                "userPrompt": "{{this.state.request.body.message}}",
                "description": "AI Agent plugin using OpenRouter API",
                "color": "text-blue-500", "bgColor": "bg-blue-50", "borderColor": "border-blue-200",
                "headers": [{}], "body": [{}],
                "properties": [
                  { "label": "OpenRouter API Token", "name": "token",        "type": "text",     "required": true, "default": null },
                  { "label": "LLM Model",            "name": "model",        "type": "text",     "required": true, "default": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
                  { "label": "System Prompt",        "name": "systemPrompt", "type": "textarea", "required": true, "default": null },
                  { "label": "User Prompt",          "name": "userPrompt",   "type": "textarea", "required": true, "default": null }
                ]
              },
              "width": 153, "height": 66, "selected": false, "positionAbsolute": { "x": 236, "y": 250 }, "dragging": false
            },
            {
              "id": "3", "type": "TelegramNode",
              "position": { "x": 250, "y": 400 },
              "data": {
                "label": "TelegramNode", "name": "trigger_telegramnode_3", "type": "TelegramNode",
                "botToken": "{{this.state.envData.TELEGRAM_BOT_TOKEN}}",
                "chatId":   "{{this.state.envData.TELEGRAM_CHAT_ID}}",
                "message":  "{{this.state.steps.trigger_aiagentnode_2.output.data.choices[0].message.content}}",
                "description": "Send messages via Telegram Bot API",
                "color": "text-blue-500", "bgColor": "bg-blue-50", "borderColor": "border-blue-200",
                "headers": [{}], "body": [{}],
                "properties": [
                  { "label": "Bot Token", "name": "botToken", "type": "text", "required": true, "default": null },
                  { "label": "Chat ID",   "name": "chatId",   "type": "text", "required": true, "default": null },
                  { "label": "Message",   "name": "message",  "type": "text", "required": true, "default": null }
                ]
              },
              "width": 133, "height": 66, "selected": false, "positionAbsolute": { "x": 250, "y": 400 }, "dragging": false
            }
          ],
          "edges": [
            { "source": "1", "sourceHandle": null, "target": "2", "targetHandle": null, "id": "reactflow__edge-1-2" },
            { "source": "2", "sourceHandle": null, "target": "3", "targetHandle": null, "id": "reactflow__edge-2-3" }
          ]
        }
      }
    }
  ]
}
```

### Example C — Authenticate then use token in next request

Execution nodes (the pattern for chained auth flows):

```json
[
  { "type": "start", "name": "trigger_start_1", "input": {}, "output": {} },
  {
    "type": "api", "name": "trigger_api_2",
    "setting": {
      "method": "POST",
      "url": "https://api.example.com/auth",
      "headers": [{}],
      "body": [
        { "key": "email",    "value": "{{this.state.request.body.email}}" },
        { "key": "password", "value": "{{this.state.request.body.password}}" }
      ]
    },
    "input": {}, "output": {}
  },
  {
    "type": "api", "name": "trigger_api_3",
    "setting": {
      "method": "GET",
      "url": "https://api.example.com/users",
      "headers": [
        { "key": "Authorization", "value": "Bearer {{this.state.steps.trigger_api_2.output.token}}" }
      ],
      "body": [{}]
    },
    "input": {}, "output": {}
  }
]
```

### Example D — Condition branch on API response

Execution nodes:

```json
[
  { "type": "start", "name": "trigger_start_1", "input": {}, "output": {} },
  {
    "type": "api", "name": "trigger_api_2",
    "setting": { "method": "GET", "url": "https://api.example.com/status", "headers": [{}], "body": [{}] },
    "input": {}, "output": {}
  },
  {
    "type": "condition", "name": "trigger_condition_3",
    "setting": {
      "condition": {
        "left":  { "type": "expression", "value": "{{this.state.steps.trigger_api_2.output.status}}" },
        "right": { "type": "raw",        "value": "ok" },
        "operator": "=="
      },
      "success": [
        {
          "type": "api", "name": "trigger_api_4",
          "setting": { "method": "POST", "url": "https://webhook.site/success", "headers": [{}], "body": [{ "key": "status", "value": "healthy" }] },
          "input": {}, "output": {}
        }
      ],
      "fail": [
        {
          "type": "api", "name": "trigger_api_5",
          "setting": { "method": "POST", "url": "https://webhook.site/alert", "headers": [{}], "body": [{ "key": "status", "value": "down" }] },
          "input": {}, "output": {}
        }
      ]
    },
    "input": {}, "output": {}
  }
]
```

---

## 13. Common mistakes to avoid

| Mistake | Correct behaviour |
|---|---|
| Using `step.nodeName` instead of `steps.nodeName` | Always `this.state.steps.<name>` |
| Forgetting `this.state.` prefix in expressions | All state paths start with `this.state.` |
| Omitting `input: {}` and `output: {}` from execution nodes | Always include them, even empty |
| Node `name` in execution list does not match `data.name` in visual node | Both must be identical |
| Placing loop/condition children in top-level `data.nodes` | Children go inside `setting.nodes` / `setting.success` / `setting.fail` only |
| Not registering a plugin in `plugins` when using it | Every plugin `type` used in a flow needs a matching `plugins` entry |
| Forgetting `properties` in plugin `setting` | Plugin nodes need the full `properties` array in `setting` for the UI to re-render the form |
| Not syncing `data.nodes` and `originalWorkflow` | Both representations must describe the same flow |
| Wrong edge `id` format | Format: `reactflow__edge-<sourceId>-<targetId>` |
| Hardcoding tokens, passwords, DB URLs | Store sensitive values in `envData` and reference via `{{this.state.envData.KEY}}` |
| Missing `"body": [{}]` and `"headers": [{}]` in plugin setting | Always include them even when empty |

---

## 14. Checklist before delivering a generated flow

- [ ] `data.nodes` starts with a `start` node as the first entry.
- [ ] Every node has a unique `name` within the flow.
- [ ] Every expression uses the `this.state.` prefix inside `{{ }}`.
- [ ] Loop children are only in `setting.nodes`, not in top-level `data.nodes`.
- [ ] Condition children are only in `setting.success`/`setting.fail`.
- [ ] `originalWorkflow.nodes` has a visual entry for every top-level execution node.
- [ ] Loop and condition children appear in `originalWorkflow` as visual nodes connected via special edges.
- [ ] Every edge has the correct `id` format.
- [ ] Every plugin type used has a matching entry in the root `plugins` array.
- [ ] Sensitive values are in `envData`, not hardcoded.
- [ ] `input: {}` and `output: {}` are present on every execution node.
- [ ] Plugin nodes include `properties`, `label`, `type`, `description`, `color`, `bgColor`, `borderColor`, `headers`, `body`, and `name` inside `setting`.
- [ ] Node positions in `originalWorkflow` follow the vertical layout guide (y increments of ~150).
