# Fake Todos Plugin

Performs CRUD operations against the public
[DummyJSON Todos API](https://dummyjson.com/todos) — a fake dataset of to-do
items that needs no setup.

## What it is

This plugin is a ready-to-use data source for learning and prototyping. It
supports four operations: listing all todos, fetching a single todo by id,
deleting a todo by id, and creating a new todo. Because the API is public and
requires no credentials, it is ideal for testing flows, Condition/Loop nodes,
and downstream logic before wiring up a real backend.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
FakeTodosNode
```

- npm package: `fake-todos-plugin`
- CDN (browser): https://unpkg.com/fake-todos-plugin@2.0.0/dist/bundle.js
- CDN (server): https://unpkg.com/fake-todos-plugin@2.0.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `FakeTodosNode`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Default | Description |
|---|---|---|---|---|
| `operation` | select | yes | `getAll` | The CRUD operation to perform. |
| `id` | text | no | — | Todo id. Shown when `operation` is `getById` or `deleteById`. |
| `todo` | text | no | — | Todo description. Shown when `operation` is `createTodo`. |
| `completed` | select | no | `false` | Whether the todo is done. Shown when `operation` is `createTodo`. |
| `userId` | text | no | — | User id to associate with the new todo. Shown when `operation` is `createTodo`. |

### `operation` options

| Value | Description |
|---|---|
| `getAll` | Retrieve all todos. |
| `getById` | Fetch a single todo by id. Requires `id`. |
| `deleteById` | Delete a todo by id. Requires `id`. |
| `createTodo` | Create a new todo. Requires `todo` and `userId`. |

## Output

Every operation returns the standard `{ ok, data }` envelope.

- `getAll` — `data` is the DummyJSON list response (`todos`, `total`, `skip`, `limit`).
- `getById` — `data` is the todo object.
- `deleteById` — `data` is `{ "removed": true }`.
- `createTodo` — `data` is `{ "created": true, ... }` with the API response.

```json
{ "ok": true, "data": { "todos": [ { "id": 1, "todo": "...", "completed": false, "userId": 26 } ], "total": 150 } }
```

On failure:

```json
{ "ok": false, "error": "Request failed with status code 404" }
```

## Example

```json
{
  "type": "FakeTodosNode",
  "name": "listTodos",
  "setting": {
    "operation": "getAll"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- DummyJSON is a third-party public test service. Data is not persistent —
  creates and deletes are simulated. Do not use it with real or sensitive data.
- `getAll` returns a paginated response (30 items by default); this plugin has
  no pagination parameter.
- Missing required fields throw before any request is made; network/API errors
  return `{ ok: false, error }`.

See `skill.md` for the machine-readable description used by AI agents.
