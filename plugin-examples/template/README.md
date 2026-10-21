# Template Plugin (GitHub example)

A starter template for building custom plugins for Flow Requests. It shows the
full plugin skeleton using the public GitHub API as an example integration, so
you can copy it and replace the logic with your own.

> This template is not published. Its `execute()` method is intentionally
> commented out and currently always returns `{ "ok": true }`.

## What it is

A Flow Requests plugin is a TypeScript class that extends `NodeBase`, declares
its form fields in `getConfig()`, and runs its logic in `execute()`. This
template includes three operations — `getProfile`, `getRepos`, and
`getSpecificRepo` — and a conditional field (`repoName`) that only appears
when `getSpecificRepo` is selected.

Use it as the base when creating a new plugin.

## Library name

When you build your own plugin from this template, the library name is the
value you set in `webpack.config.cjs`:

```
<CHANGE_VALE_HERE>
```

This value **must match** the `name` and `type` fields in `getConfig()` (this
template uses `TemplateNode`). Enter the same value as the **Library Name**
when installing the plugin in Flow Requests.

> The `<CHANGE_VALE_HERE>` placeholder is intentional — replace it with your
> own PascalCase plugin name.

## Configuration

| Setting | Type | Required | Default | Description |
|---|---|---|---|---|
| `username` | text | yes | — | GitHub username to query. |
| `operation` | select | yes | `getProfile` | The GitHub API operation to perform. |
| `repoName` | text | no | — | Repository name. Only shown when `operation` is `getSpecificRepo`. |

### `operation` options

| Value | Description |
|---|---|
| `getProfile` | Fetch a user's GitHub profile. |
| `getRepos` | List all public repositories for a user. |
| `getSpecificRepo` | Fetch details for a single repository. |

## Output

The `execute()` method is commented out, so the plugin currently returns:

```json
{ "ok": true }
```

Once implemented, the convention is `{ "ok": true, "data": ... }` on success
and `{ "ok": false, "error": "..." }` on failure.

## Example

```json
{
  "type": "TemplateNode",
  "name": "githubNode",
  "setting": {
    "username": "octocat",
    "operation": "getProfile"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Creating your own plugin from this template

1. Copy this folder and rename it.
2. Update `name`, `version`, and `description` in `package.json`.
3. Set the `library` value in `webpack.config.cjs`.
4. Rename the class and update `name`/`type` in `getConfig()`.
5. Implement `execute()`, using `this.parseExpression()` for dynamic values.
6. Write a `README.md` and a `skill.md` for your plugin.

See `skill.md` for the machine-readable description used by AI agents.
