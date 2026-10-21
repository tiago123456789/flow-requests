# Code Plugin

Runs custom JavaScript against the data you provide, inside an isolated
`node:vm` sandbox.

## What it is

This plugin lets a flow transform or compute values with arbitrary JavaScript.
You write an expression or a `return`-style snippet in the `code` field, and
optionally pass input through the `data` field. The code runs in a sandboxed
`node:vm` context where each key of `data` is available as a variable, and the
value your code returns becomes `output.data`.

Use it for small calculations, reshaping objects, or extracting fields without
writing a dedicated plugin.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
CodeNode
```

- npm package: `code-plugin-flow-requests`
- CDN (browser): https://unpkg.com/code-plugin-flow-requests@1.0.0/dist/bundle.js
- CDN (server): https://unpkg.com/code-plugin-flow-requests@1.0.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `CodeNode`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Description |
|---|---|---|---|
| `code` | textarea | yes | JavaScript to execute. The value you return becomes the node output. Each key of `data` is available as a variable. Supports `{{ }}` expressions. |
| `data` | textarea | no | JSON object of input values, spread into the sandbox. Must be valid JSON. |

## Output

Success:
```json
{ "ok": true, "data": "<return value of the code>" }
```

Failure:
```json
{ "ok": false, "error": "..." }
```

## Example

Sum all values in an array coming from a previous node:

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

Extract fields from an object:

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

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- The sandbox uses `node:vm` and is only available server-side. It is imported
  at runtime with `/* webpackIgnore: true */` so it is not bundled for the
  browser.
- `data` must be valid JSON; invalid JSON throws before execution.
- Avoid side effects in the code — treat it as a pure transformation.

See `skill.md` for the machine-readable description used by AI agents.
