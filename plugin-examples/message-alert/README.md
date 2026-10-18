# Message Alert Plugin

Shows a browser alert (or logs to the console on the server) with a message
you build from flow data.

## What it is

This is a debugging and notification helper. When the flow runs in the browser
it displays the resolved message with `alert()`; when it runs server-side it
writes it to the console. It is handy for inspecting values mid-flow, or for
confirming that an earlier step produced what you expect.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
AlertMessageNode
```

- npm package: `alert-message-plugin-flow-requests`
- CDN (browser): https://unpkg.com/alert-message-plugin-flow-requests@2.0.0/dist/bundle.js
- CDN (server): https://unpkg.com/alert-message-plugin-flow-requests@2.0.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `AlertMessageNode`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Description |
|---|---|---|---|
| `message` | text | yes | The message to display or log. Supports `{{ }}` expressions. |

## Output

Success:
```json
{ "ok": true }
```

The node produces no data — it is used for its side effect. If `message` is
missing it throws before executing.

Failure (runtime alert error):
```json
{ "ok": false, "error": "..." }
```

## Example

```json
{
  "type": "AlertMessageNode",
  "name": "debugOutput",
  "setting": {
    "message": "Step output: {{ steps.httpNode.output.data }}"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- In the browser this blocks execution with a native alert dialog; only use it
  during development or for genuinely important notices.
- In server-side runs the message is written to the console instead.

See `skill.md` for the machine-readable description used by AI agents.
