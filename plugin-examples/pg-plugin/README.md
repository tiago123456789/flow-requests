# Postgres Plugin

Connects to a PostgreSQL database and runs parameterized SQL queries using
[postgres.js](https://github.com/porsager/postgres) (`npm:postgres`).

## What it is

This plugin executes a SQL statement against a Postgres database and returns
the resulting rows. Bind values are passed separately through the `params`
field, so queries stay parameterized (no string concatenation) and safe from
SQL injection. It covers both reads (`SELECT ... RETURNING`) and writes
(`INSERT`, `UPDATE`, `DELETE`).

The Postgres driver is imported at runtime with `/* webpackIgnore: true */`, so
it is only resolved on the server-side (Deno) run and never bundled into the
browser build.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
PostgresNode
```

- npm package: `pg-plugin-flow-requests`
- CDN (browser): https://unpkg.com/pg-plugin-flow-requests@2.0.0/dist/bundle.js
- CDN (server): https://unpkg.com/pg-plugin-flow-requests@2.0.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `PostgresNode`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Default | Description |
|---|---|---|---|---|
| `dbUrl` | text | yes | — | PostgreSQL connection string. Store in env and use `{{ state.envData.DATABASE_URL }}`. |
| `query` | textarea | yes | — | SQL to execute. Use `$1`, `$2`, … placeholders for bind values. Supports `{{ }}` expressions. |
| `params` | textarea | no | `[]` | JSON array of bind values for the `$1`, `$2`, … placeholders. |

## Output

Success — the result rows and query metadata:

```json
{
  "ok": true,
  "data": {
    "rows": [ { "id": 1, "name": "Alice" } ],
    "rowCount": 1,
    "command": "SELECT"
  }
}
```

Failure:
```json
{ "ok": false, "error": "relation \"users\" does not exist" }
```

## Example

Select a user by email:

```json
{
  "type": "PostgresNode",
  "name": "getUser",
  "setting": {
    "dbUrl": "{{ state.envData.DATABASE_URL }}",
    "query": "SELECT id, name, email FROM users WHERE email = $1 LIMIT 1",
    "params": "[\"{{ steps.inputNode.output.data.email }}\"]"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- Always store the connection string in an environment variable — never inline
  credentials.
- Prefer `params` over interpolating values into the query text.
- The connection is opened per execution and closed when the node finishes.
- This node is server-side only, since it relies on the `npm:postgres` runtime
  import.

See `skill.md` for the machine-readable description used by AI agents.
