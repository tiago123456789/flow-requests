# Skill: Template Plugin (GitHub Example)

**Name:** TemplateNode
**Version:** —
**npm package:** *(not published — starter template)*
**CDN (browser):** *(not published)*
**CDN (server):** *(not published)*
**Library name:** TemplateNode

---

## Description

A starter template plugin that demonstrates how to build a custom Flow
Requests plugin from scratch, using the GitHub public API as the example
integration.

The plugin skeleton includes three operations — `getProfile`, `getRepos`, and
`getSpecificRepo` — with a conditional `repoName` field that only appears when
`getSpecificRepo` is selected. The `execute` method is intentionally commented
out so developers can fill in their own logic.

Use this as the base when creating a new plugin: rename the class, update the
`name`/`type` in `getConfig()`, replace the properties with your own, and
implement `execute()`.

---

## When to use this plugin

- As a starting point when creating a brand-new custom plugin for Flow Requests.
- As a reference for how `conditionShow` works to show/hide fields based on a
  `select` property value.
- As an example of how to structure multi-operation plugins.
- To study the `NodeBase`, `NodeConfig`, `NodeInput`, and `NodeReturn` types
  from `core-package-mini-n8n`.

---

## Node properties (settings)

| Property name | Type   | Required | Default      | Description |
|---------------|--------|----------|--------------|-------------|
| `username`    | text   | yes      | —            | GitHub username to query. |
| `operation`   | select | yes      | `getProfile` | The GitHub API operation to perform. |
| `repoName`    | text   | no       | —            | Repository name. Only shown when `operation` is `getSpecificRepo`. |

### `operation` options

| Value            | Description |
|------------------|-------------|
| `getProfile`     | Fetch a user's GitHub profile (`GET /users/:username`). |
| `getRepos`       | List all public repositories for a user (`GET /users/:username/repos`). |
| `getSpecificRepo`| Fetch details for a single repository (`GET /repos/:username/:repoName`). |

---

## Output shape

> **Note:** The `execute` method is commented out in this template. In its
> current state the plugin always returns `{ ok: true }` with no data.

When `execute` is implemented, the expected output shape would be:

**`getProfile` / `getSpecificRepo`** — a single GitHub object:
```json
{
  "ok": true,
  "data": {
    "id": 123456,
    "login": "octocat",
    "name": "The Octocat",
    "public_repos": 8
  }
}
```

**`getRepos`** — an array of repository objects:
```json
{
  "ok": true,
  "data": [
    { "id": 1, "name": "Hello-World", "full_name": "octocat/Hello-World" }
  ]
}
```

**Failure** (when `execute` is implemented):
```json
{
  "ok": false,
  "error": "Not Found"
}
```

---

## How to reference output in downstream nodes

*(Once execute is implemented)*

```
{{ steps.githubNode.output.ok }}               — boolean, true on success
{{ steps.githubNode.output.data }}             — profile or repo object / array
{{ steps.githubNode.output.data.login }}       — GitHub username (getProfile)
{{ steps.githubNode.output.data[0].name }}     — first repo name (getRepos)
{{ steps.githubNode.output.error }}            — error message on failure
```

---

## How to build a plugin from this template

1. Copy the `template/` folder and rename it (e.g. `my-plugin/`).
2. In `package.json`, update `name`, `version`, and `description`.
3. In `src/index.ts`:
   - Rename the class (`TemplateNode` → `MyPlugin`).
   - Update `name` and `type` in `getConfig()` to your plugin's identifier.
   - Replace the `properties` array with your plugin's fields.
   - Implement the `execute()` method with your integration logic.
4. Use `this.parseExpression(value)` to resolve `{{ }}` template expressions
   from settings.
5. Return `{ ok: true, data: <result> }` on success and
   `{ ok: false, error: <message> }` on failure.
6. Run `npm run build` to produce `dist/bundle.js` (browser) and
   `dist/deno-bundle.js` (server).
7. Install the built plugin in Flow Requests via the custom plugin installer.

---

## Example: minimal custom plugin

```typescript
import { NodeBase, NodeConfig, NodeInput, NodeReturn } from "core-package-mini-n8n";

class MyPlugin extends NodeBase {
  constructor(state: any) { super(state); }

  getConfig(): NodeConfig {
    return {
      name: "MyPlugin",
      type: "MyPlugin",
      description: "My custom plugin",
      properties: [
        { label: "URL", name: "url", type: "text", required: true, default: null },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const url = this.parseExpression(node.settings.url);
    try {
      const res = await fetch(url);
      const data = await res.json();
      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export default MyPlugin;
```

---

## Constraints and caveats

- **Execute is stubbed out** — the template's `execute` method only returns
  `{ ok: true }`. You must implement your own logic before using it in a real
  flow.
- **GitHub API rate limits** — the GitHub public API allows 60 unauthenticated
  requests per hour per IP. For higher limits, add an `Authorization` header
  with a personal access token.
- **`name` and `type` must match** — the `name` and `type` fields in
  `getConfig()` must be identical and must match the class name used when
  registering the plugin in Flow Requests.
- **`conditionShow` controls field visibility** — the `conditionShow` array on
  a property hides or shows it based on the value of another property. This is
  purely a UI concern; settings are still accessible in `execute()` regardless.
- **Both bundles are required** — run `npm run build` to generate both
  `dist/bundle.js` (browser UI) and `dist/deno-bundle.js` (server execution).
  Skipping either will cause the plugin to fail in the corresponding runtime.
