# Skill: Fake Todos Plugin

**Name:** FakeTodosNode
**Version:** 2.0.0
**npm package:** fake-todos-plugin
**CDN (browser):** https://unpkg.com/fake-todos-plugin@2.0.0/dist/bundle.js
**CDN (server):** https://unpkg.com/fake-todos-plugin@2.0.0/dist/deno-bundle.js
**Library name:** FakeTodosNode

---

## Description

Interacts with the [DummyJSON Todos API](https://dummyjson.com/todos) to
perform CRUD operations on a public fake dataset of to-do items.

Supports four operations: listing all todos, fetching a single todo by ID,
deleting a todo by ID, and creating a new todo. This plugin is ideal for
learning and prototyping flows that involve list management, without needing
a real backend.

Use this node to explore how Flow Requests handles multi-operation plugins,
conditional properties, and basic REST API interactions.

---

## When to use this plugin

- Prototype a workflow involving list management before connecting a real API.
- Test Condition and Loop nodes with a live data source that needs no setup.
- Demonstrate how a Flow Requests plugin handles multiple operations with
  conditional fields.
- Use as a placeholder data source while developing and testing downstream nodes.

---

## Node properties (settings)

| Property name | Type   | Required | Default  | Description |
|---------------|--------|----------|----------|-------------|
| `operation`   | select | yes      | `getAll` | The CRUD operation to perform. See options below. |
| `id`          | text   | no       | —        | Todo ID. Shown only when `operation` is `getById` or `deleteById`. |
| `todo`        | text   | no       | —        | Todo description text. Shown only when `operation` is `createTodo`. |
| `completed`   | select | no       | `false`  | Whether the todo is done. Shown only when `operation` is `createTodo`. |
| `userId`      | text   | no       | —        | User ID to associate with the new todo. Shown only when `operation` is `createTodo`. |

### `operation` options

| Value        | Description |
|--------------|-------------|
| `getAll`     | Retrieve all todos from the fake API. |
| `getById`    | Fetch a single todo by its numeric ID. Requires `id`. |
| `deleteById` | Delete a todo by its numeric ID. Requires `id`. |
| `createTodo` | Create a new todo. Requires `todo` and `userId`. |

---

## Output shape

Every operation returns the standard `{ ok, data }` envelope.

**`getAll`** — the full DummyJSON todos response under `data`:
```json
{
  "ok": true,
  "data": {
    "todos": [
      { "id": 1, "todo": "Do something nice for someone", "completed": false, "userId": 26 }
    ],
    "total": 150,
    "skip": 0,
    "limit": 30
  }
}
```

**`getById`** — a single todo object under `data`:
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "todo": "Do something nice for someone",
    "completed": false,
    "userId": 26
  }
}
```

**`deleteById`** — a confirmation under `data`:
```json
{
  "ok": true,
  "data": { "removed": true }
}
```

**`createTodo`** — a confirmation plus the API response under `data`:
```json
{
  "ok": true,
  "data": { "created": true, "id": 151, "todo": "Review the weekly report", "completed": false, "userId": 5 }
}
```

**Failure** (network / API error):
```json
{
  "ok": false,
  "error": "Request failed with status code 404"
}
```

---

## How to reference output in downstream nodes

```
{{ steps.todosNode.output.ok }}                 — boolean, true on success
{{ steps.todosNode.output.data.todos }}         — array of todos (getAll)
{{ steps.todosNode.output.data.todos[0].id }}   — first todo ID (getAll)
{{ steps.todosNode.output.data.total }}         — total count (getAll)
{{ steps.todosNode.output.data.id }}            — todo ID (getById)
{{ steps.todosNode.output.data.todo }}          — todo text (getById)
{{ steps.todosNode.output.data.completed }}     — completion status (getById)
{{ steps.todosNode.output.data.removed }}       — true after deleteById
{{ steps.todosNode.output.data.created }}       — true after createTodo
{{ steps.todosNode.output.error }}              — error message on failure
```

Use a Loop node to iterate over `{{ steps.todosNode.output.data.todos }}` when
processing all results from `getAll`.

---

## Example flow snippets

Get all todos and iterate over them:

```json
{
  "type": "FakeTodosNode",
  "name": "listTodos",
  "setting": {
    "operation": "getAll"
  }
}
```

Get a specific todo by ID from a previous node's output:

```json
{
  "type": "FakeTodosNode",
  "name": "getTodo",
  "setting": {
    "operation": "getById",
    "id": "{{ steps.inputNode.output.data.todoId }}"
  }
}
```

Create a new todo:

```json
{
  "type": "FakeTodosNode",
  "name": "addTodo",
  "setting": {
    "operation": "createTodo",
    "todo": "Review the weekly report",
    "completed": "false",
    "userId": "5"
  }
}
```

Delete a todo by ID:

```json
{
  "type": "FakeTodosNode",
  "name": "removeTodo",
  "setting": {
    "operation": "deleteById",
    "id": "{{ steps.getTodo.output.id }}"
  }
}
```

---

## Constraints and caveats

- **Public fake API** — DummyJSON (`dummyjson.com`) is a third-party public
  test service. Data is not persistent; creates and deletes are simulated.
  Do not use this plugin with real or sensitive data.
- **Uniform output envelope** — every operation returns `{ ok, data }`. Check
  `ok` before reading `data` (or `error` on failure).
- **Structured errors** — network/API failures return `{ ok: false, error }`
  instead of throwing, so flows can branch on them. Only missing required
  fields throw before any request is made.
- **`id` must be provided** for `getById` and `deleteById` — a missing `id`
  throws `"You need to provide the id"` before any request is made.
- **`todo` and `userId` must be provided** for `createTodo` — a missing value
  throws before any request is made.
- **Conditional fields** — `id`, `todo`, `completed`, and `userId` are only
  visible in the node editor when the matching `operation` is selected.
  Setting them for the wrong operation has no effect.
- **`getAll` returns paginated data** — by default DummyJSON returns 30 items
  with `skip: 0`. There is no built-in pagination parameter in this plugin.
