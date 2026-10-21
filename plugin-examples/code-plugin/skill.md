# Skill: Code Plugin

**Name:** CodeNode
**Version:** 1.0.0
**npm package:** code-plugin-flow-requests
**CDN (browser):** https://unpkg.com/code-plugin-flow-requests@1.0.0/dist/bundle.js
**CDN (server):** https://unpkg.com/code-plugin-flow-requests@1.0.0/dist/deno-bundle.js
**Library name:** CodeNode

---

## Description

Executes custom JavaScript code against provided data inside an isolated
[`node:vm`](https://nodejs.org/api/vm.html) sandbox.

The code runs in a secure context where a `data` object is available as the
execution context. Whatever value is returned by the code expression becomes
the node's output. This lets you perform arbitrary transformations, calculations,
or data manipulations inline without leaving the flow.

Use this node whenever you need a lightweight scripting step — filtering an
array, mapping keys, formatting a string, or computing a derived value from
previous nodes' outputs.

---

## When to use this plugin

- Transform or reshape JSON data from a previous HTTP request node.
- Filter an array of items based on a condition before passing it downstream.
- Compute derived values (e.g. totals, averages, date formatting) within the flow.
- Quickly prototype logic before moving it to a dedicated plugin.
- Merge or flatten data from multiple upstream nodes into a single object.

---

## Node properties (settings)

| Property name | Type     | Required | Default | Description |
|---------------|----------|----------|---------|-------------|
| `code`        | textarea | yes      | —       | JavaScript expression or statement that returns the output value. |
| `data`        | textarea | no       | `{}`    | JSON object injected into the sandbox context. Keys become top-level variables inside the code. |

### `code` notes

The code is wrapped as an immediately-invoked function expression (IIFE):

```js
output = (() => { return <your code> })()
```

So the value you `return` becomes `data` in the success output. You have full
access to the properties of the `data` object as top-level variables in the
sandbox.

### `data` notes

Must be a valid JSON object. Supports `{{ }}` expressions so you can inject
values from previous nodes, e.g.:

```json
{ "items": {{ steps.fetchNode.output.data.items }} }
```

---

## Output shape

Success:
```json
{
  "ok": true,
  "data": "<return value of the code expression>"
}
```

`data` can be any JSON-serialisable value: object, array, string, number, or boolean.

Failure (runtime error in the code):
```json
{
  "ok": false,
  "error": "ReferenceError: foo is not defined"
}
```

Failure (invalid JSON in `data`):
The node throws before execution with the message:
`"Invalid settings. data must be a valid JSON"`

---

## How to reference output in downstream nodes

```
{{ steps.codeNode.output.ok }}          — boolean, true on success
{{ steps.codeNode.output.data }}        — the return value of the code
{{ steps.codeNode.output.error }}       — error message on failure
```

---

## Example flow snippets

Sum all values in an array from a previous node:

```json
{
  "type": "CodeNode",
  "name": "sumValues",
  "setting": {
    "code": "items.reduce((acc, n) => acc + n, 0)",
    "data": "{ \"items\": {{ steps.fetchNode.output.data.values }} }"
  }
}
```

Format a date string:

```json
{
  "type": "CodeNode",
  "name": "formatDate",
  "setting": {
    "code": "new Date(ts).toISOString().slice(0, 10)",
    "data": "{ \"ts\": \"{{ steps.prev.output.data.timestamp }}\" }"
  }
}
```

Extract specific keys from an object:

```json
{
  "type": "CodeNode",
  "name": "pickFields",
  "setting": {
    "code": "({ id: user.id, email: user.email })",
    "data": "{ \"user\": {{ steps.getUser.output.data }} }"
  }
}
```

---

## Constraints and caveats

- **Sandbox isolation** — code runs inside `node:vm`. It does not have access to
  `require`, `import`, `fetch`, or the Node.js global scope. Only the sandbox
  context (`data` properties + `output`) is available.
- **Browser bundle** — in the browser the `node:vm` module is not available.
  The browser bundle is intended only for `getConfig()` / UI rendering. Actual
  execution must happen in the server (Deno) runtime.
- **`data` must be valid JSON** — passing a non-JSON string in `data` will throw
  before the code runs. Use `{{ }}` expressions carefully; ensure referenced
  values are serialisable.
- **Return value** — always use `return` explicitly. A code block that only has
  side effects (e.g. `console.log(x)`) will return `undefined`, and
  `data` will be `undefined` in the output.
- **No async/await** — the sandbox runs synchronously. Network calls or async
  operations are not supported inside `code`.
- **Error handling** — runtime errors in the code set `ok: false` and populate
  `error`. The flow will continue only if a Condition node or error-handler is
  connected downstream.
