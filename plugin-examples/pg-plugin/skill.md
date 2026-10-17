# Skill: Postgres Plugin

**Name:** PostgresNode
**Version:** 1.0.6
**npm package:** pg-plugin-flow-requests
**CDN (browser):** https://unpkg.com/pg-plugin-flow-requests@1.0.6/dist/bundle.js
**CDN (server):** https://unpkg.com/pg-plugin-flow-requests@1.0.6/dist/deno-bundle.js
**Library name:** PostgresNode

---

## Description

Connects to a PostgreSQL database and executes a parameterized SQL query using
[postgres.js](https://github.com/porsager/postgres) (`npm:postgres`).

The plugin accepts a connection string, an arbitrary SQL statement, and an
optional JSON array of bind values. Results are returned as an array of row
objects. Parameterized queries (`$1`, `$2`, …) prevent SQL injection by
sending bind values separately from the query text.

Use this node whenever a flow needs to read from or write to a Postgres
database — fetching user records, inserting events, running aggregations, or
updating rows based on data from previous nodes.

---

## When to use this plugin

- Fetch a record by ID from a Postgres table and pass it to downstream nodes.
- Insert a new row after processing data from an HTTP request node.
- Run an aggregate query (COUNT, SUM, AVG) and use the result in a Condition node.
- Update a record's status as part of an automated workflow.
- Join multiple tables and return the result for further transformation.

---

## Node properties (settings)

| Property name | Type     | Required | Default | Description |
|---------------|----------|----------|---------|-------------|
| `dbUrl`       | text     | yes      | —       | PostgreSQL connection string. Always store in env and reference with `{{ state.envData.DATABASE_URL }}`. |
| `query`       | textarea | yes      | —       | SQL to execute. Use `$1`, `$2` placeholders for bind values. Supports `{{ }}` expressions. |
| `params`      | textarea | no       | `[]`    | JSON array of bind values corresponding to `$1`, `$2`, … placeholders. |

### `dbUrl` format

```
postgresql://user:password@host:5432/database
```

Store sensitive credentials as environment variables:

```
{{ state.envData.DATABASE_URL }}
```

### `params` format

Must be a valid JSON array. Each element maps to the corresponding `$N`
placeholder in the query:

```json
["alice@example.com", true]
```

Supports `{{ }}` expressions inside the array elements when the array itself
is built as a string.

---

## Output shape

Success:
```json
{
  "ok": true,
  "data": {
    "rows": [
      { "id": 1, "name": "Alice", "email": "alice@example.com" }
    ],
    "rowCount": 1,
    "command": "SELECT"
  }
}
```

- `rows` — array of result row objects (empty array for INSERT/UPDATE/DELETE with no RETURNING).
- `rowCount` — number of rows affected or returned.
- `command` — SQL command executed (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, etc.).

Failure:
```json
{
  "ok": false,
  "error": "relation \"users\" does not exist"
}
```

---

## How to reference output in downstream nodes

```
{{ steps.queryNode.output.ok }}                        — boolean, true on success
{{ steps.queryNode.output.data.rows }}                 — array of result rows
{{ steps.queryNode.output.data.rows[0].id }}           — first row, id column
{{ steps.queryNode.output.data.rowCount }}             — number of rows
{{ steps.queryNode.output.data.command }}              — SQL command type
{{ steps.queryNode.output.error }}                     — error message on failure
```

Use a Loop node to iterate over `{{ steps.queryNode.output.data.rows }}` when
processing multiple rows.

---

## Example flow snippets

Select a user by email:

```json
{
  "type": "postgres",
  "name": "getUser",
  "setting": {
    "dbUrl": "{{ state.envData.DATABASE_URL }}",
    "query": "SELECT id, name, email FROM users WHERE email = $1 LIMIT 1",
    "params": "[\"{{ steps.inputNode.output.data.email }}\"]"
  }
}
```

Insert a new record and return the generated ID:

```json
{
  "type": "postgres",
  "name": "createOrder",
  "setting": {
    "dbUrl": "{{ state.envData.DATABASE_URL }}",
    "query": "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id",
    "params": "[{{ steps.getUser.output.data.rows[0].id }}, {{ steps.calcTotal.output.data }}]"
  }
}
```

Count rows matching a condition:

```json
{
  "type": "postgres",
  "name": "countActive",
  "setting": {
    "dbUrl": "{{ state.envData.DATABASE_URL }}",
    "query": "SELECT COUNT(*) AS total FROM subscriptions WHERE active = $1",
    "params": "[true]"
  }
}
```

---

## Constraints and caveats

- **Credentials are sensitive** — always store the connection string in the
  flow's environment variables and reference it with
  `{{ state.envData.DATABASE_URL }}`. Never hardcode credentials in the node
  settings.
- **Parameterized queries only** — always use `$1`, `$2` placeholders with the
  `params` array. Never interpolate user-controlled values directly into the
  query string — that would create an SQL injection vulnerability.
- **`params` must be a JSON array** — passing a non-array JSON value will throw
  `"params must be a JSON array"` before any query is sent.
- **Connection is closed after each execute** — the plugin calls `sql.end()`
  in a `finally` block. There is no connection pooling across nodes; each node
  opens and closes its own connection.
- **Server-side only** — `npm:postgres` relies on the Deno runtime and TCP
  sockets. The browser bundle only supports `getConfig()`. All actual execution
  must run on the server.
- **`rows` is empty for mutations without RETURNING** — INSERT, UPDATE, and
  DELETE without a `RETURNING` clause return an empty `rows` array. Use
  `rowCount` to confirm the number of affected rows.
- **Errors do not throw** — execution errors are caught and returned as
  `{ ok: false, error: "..." }`. Add a Condition node to branch on `ok` if
  the flow must handle failures gracefully.
