# Skill: Fake Todos Plugin

**Name:** FakeTodosNode
**Version:** 1.1.1
**npm package:** fake-todos-plugin
**CDN (browser):** https://unpkg.com/fake-todos-plugin@1.1.1/dist/bundle.js
**CDN (server):** https://unpkg.com/fake-todos-plugin@1.1.1/dist/deno-bundle.js
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
| `createTodo` | Create a new todo. Requires `todo`, `completed`, and `userId`. |

---

## Output shape

**`getAll`** — returns the full DummyJSON todos response:
```json
{
  "todos": [
    { "id": 1, "todo": "Do something nice for someone", "completed": false, "userId": 26 }
  ],
  "total": 150,
  "skip": 0,
  "limit": 30
}
```

**`getById`** — returns a single todo object:
```json
{
  "id": 1,
  "todo": "Do something nice for someone",
  "completed": false,
  "userId": 26
}
```

**`deleteById`** — returns a confirmation:
```json
{
  "removed": true
}
```

**`createTodo`** — returns a confirmation:
```json
{
  "created": true
}
```

> Note: `getAll` and `getById` return the raw DummyJSON API response directly
> (not wrapped in `{ ok, data }`). `deleteById` and `createTodo` return their
> own confirmation objects.

---

## How to reference output in downstream nodes

```
{{ steps.todosNode.output.todos }}              — array of todos (getAll)
{{ steps.todosNode.output.todos[0].id }}        — first todo ID (getAll)
{{ steps.todosNode.output.total }}              — total count (getAll)
{{ steps.todosNode.output.id }}                 — todo ID (getById)
{{ steps.todosNode.output.todo }}               — todo text (getById)
{{ steps.todosNode.output.completed }}          — completion status (getById)
{{ steps.todosNode.output.removed }}            — true after deleteById
{{ steps.todosNode.output.created }}            — true after createTodo
```

Use a Loop node to iterate over `{{ steps.todosNode.output.todos }}` when
processing all results from `getAll`.

---

## Example flow snippets

Get all todos and iterate over them:

```json
{
  "type": "FakeTodos",
  "name": "listTodos",
  "setting": {
    "operation": "getAll"
  }
}
```

Get a specific todo by ID from a previous node's output:

```json
{
  "type": "FakeTodos",
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
  "type": "FakeTodos",
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
  "type": "FakeTodos",
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
- **Output format is not uniform** — `getAll` and `getById` return raw
  DummyJSON responses (not wrapped in `{ ok, data }`), while `deleteById` and
  `createTodo` return `{ removed: true }` and `{ created: true }`. Account
  for this difference when referencing output in downstream nodes.
- **No error wrapping** — if the DummyJSON API returns an error, the plugin
  will throw rather than returning `{ ok: false }`. Add error handling in
  the flow if network failures need to be handled gracefully.
- **`id` must be provided** for `getById` and `deleteById` — a missing `id`
  throws `"You need to provide the id"` before any request is made.
- **Conditional fields** — `id`, `todo`, `completed`, and `userId` are only
  visible in the node editor when the matching `operation` is selected.
  Setting them for the wrong operation has no effect.
- **`getAll` returns paginated data** — by default DummyJSON returns 30 items
  with `skip: 0`. There is no built-in pagination parameter in this plugin.
