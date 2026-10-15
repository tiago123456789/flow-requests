import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

// Remote driver specifier. Keep this literal in sync with
// src/postgres.d.ts and the jest.mock() path in tests/index.spec.ts.
// postgres.js equivalent of:
//   import postgres from "npm:postgres";

class PostgresNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "postgres", // Name e type needs to be the same
      type: "postgres", // Name e type needs to be the same
      description: "Connect to Postgres and run SQL queries",
      ai_description:
        "Runs a parameterized SQL query against a Postgres database. Use $1, $2 placeholders with params.",
      properties: [
        {
          label: "Database URL",
          name: "dbUrl",
          type: "text",
          required: true,
          default: null,
          ai_description:
            "Postgres connection string, e.g. postgresql://user:pass@host:5432/mydb",
        },
        {
          label: "Query",
          name: "query",
          type: "textarea",
          required: true,
          default: null,
          ai_description:
            "SQL to execute. Use $1, $2 placeholders for bind values, e.g. SELECT id, name FROM users WHERE email = $1",
        },
        {
          label: "Parameters (JSON array)",
          name: "params",
          type: "textarea",
          required: false,
          default: null,
          ai_description:
            'Optional JSON array of bind values for $1, $2 placeholders, e.g. ["alice@example.com"]',
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;
    if (!setting.dbUrl) {
      throw new Error("Invalid settings. You need to provide a dbUrl");
    }
    if (!setting.query) {
      throw new Error("Invalid settings. You need to provide a query");
    }

    const dbUrl = this.parseExpression(setting.dbUrl);
    const query = this.parseExpression(setting.query);

    let params: unknown[] = [];
    if (setting.params) {
      const rawParams = this.parseExpression(setting.params);
      try {
        params = JSON.parse(rawParams);
      } catch {
        throw new Error(
          "Invalid settings. params must be a valid JSON array"
        );
      }
      if (!Array.isArray(params)) {
        throw new Error("Invalid settings. params must be a JSON array");
      }
    }

    // Lazy remote import so the browser bundle (used only for getConfig())
    // and the bundlers never try to resolve/evaluate the Deno-only driver.
    // webpackIgnore + esbuild --external leave this as a runtime import for Deno.
    const { default: postgres } = await import(
      /* webpackIgnore: true */ "npm:postgres"
    );

    const sql = postgres(dbUrl);
    try {
      // Parameterized: values are sent separately, never concatenated into SQL
      const result = await sql.unsafe(query, params);
      return {
        ok: true,
        data: {
          rows: Array.from(result),
          rowCount: result.count ?? null,
          command: result.command ?? null,
        },
      };
    } catch (error: any) {
      return { ok: false, error: error.message };
    } finally {
      await sql.end();
    }
  }
}

export default PostgresNode;
