# Skill: Message Alert Plugin

**Name:** AlertMessageNode
**Version:** 1.4.0
**npm package:** alert-message-plugin-flow-requests
**CDN (browser):** https://unpkg.com/alert-message-plugin-flow-requests@1.4.0/dist/bundle.js
**CDN (server):** https://unpkg.com/alert-message-plugin-flow-requests@1.4.0/dist/deno-bundle.js
**Library name:** AlertMessageNode

---

## Description

Displays a message to the user or logs it to the console, depending on the
runtime environment.

- **In the browser** — calls `window.alert(message)`, opening a native browser
  alert dialog that pauses flow execution until the user clicks OK.
- **On the server** (Deno / Node) — calls `console.log(message)`, writing the
  message to standard output without pausing execution.

Use this node as a simple debugging or notification tool during flow
development, or as a lightweight human-in-the-loop checkpoint in browser-based
flows.

---

## When to use this plugin

- Display the value of a variable mid-flow to debug unexpected output.
- Show a confirmation message to the user before a destructive step (browser only).
- Log a status update to the server console during automated server-side runs.
- Add a visible checkpoint in a demo or presentation flow.

---

## Node properties (settings)

| Property name | Type | Required | Default | Description |
|---------------|------|----------|---------|-------------|
| `message`     | text | yes      | —       | The message to display or log. Supports `{{ }}` expressions. |

---

## Output shape

Success (always):
```json
{
  "ok": true
}
```

This node always returns `{ ok: true }`. It does not produce any data output
and does not fail unless `message` is missing.

Failure (missing message — throws before executing):

The node throws with:
`"Invalid settings. You need to provide a message"` — but only if the
`message` property evaluates to a falsy value after expression resolution.

---

## How to reference output in downstream nodes

```
{{ steps.alertNode.output.ok }}    — always true
```

This node is primarily used for its side effect (alerting / logging), not its
output. Downstream nodes can safely assume `ok` is `true`.

---

## Example flow snippets

Show a debug value during development:

```json
{
  "type": "AlertMessage",
  "name": "debugOutput",
  "setting": {
    "message": "Step output: {{ steps.httpNode.output.data }}"
  }
}
```

Confirm the number of rows returned by a database query:

```json
{
  "type": "AlertMessage",
  "name": "checkRowCount",
  "setting": {
    "message": "Query returned {{ steps.queryNode.output.data.rowCount }} rows."
  }
}
```

Display an error message when a previous step fails:

```json
{
  "type": "AlertMessage",
  "name": "showError",
  "setting": {
    "message": "Error: {{ steps.apiNode.output.error }}"
  }
}
```

---

## Constraints and caveats

- **Blocking in browsers** — `window.alert()` is a blocking call. The entire
  flow pauses until the user dismisses the dialog. Do not use this node in
  production browser flows where unattended execution is expected.
- **No-op on the server for interactive use** — on the server, `console.log`
  writes to stdout but does not interrupt execution. It is invisible to end
  users running the flow from the browser UI.
- **No data output** — this node does not return any meaningful data. It is
  not suitable as an intermediate step whose output feeds into later nodes.
- **Expression resolution** — `{{ }}` expressions in `message` are resolved
  before displaying. If a referenced value is `undefined` or `null`, the
  string `"undefined"` or `"null"` will appear in the message.
- **Intended for development** — this plugin is a debugging and demonstration
  tool. For production notification flows, use the Telegram plugin or a
  dedicated notification service plugin.
