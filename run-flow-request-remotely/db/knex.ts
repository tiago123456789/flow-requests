import knex from "knex";

let db: ReturnType<typeof knex> | null = null;

export function getDb() {
  if (!db) {
    db = knex({
      client: "pg",
      connection: Deno.env.get("DB_URL"),
    });
  }
  return db;
}

export async function initDatabase() {
  const database = getDb();
  const exists = await database.schema.hasTable("flow_requests");
  if (!exists) {
    await database.schema.raw(`
      CREATE TABLE flow_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255),
        data JSONB,
        flow JSONB,
        description TEXT,
        schema JSONB NOT NULL DEFAULT '[]'::jsonb
      )
    `);
    console.log("Table flow_requests created successfully");
  } else {
    console.log("Table flow_requests already exists");
  }

  // Add the explicit flow/tool metadata columns to databases created by older
  // versions, while keeping `data` available for backward compatibility.
  if (!(await database.schema.hasColumn("flow_requests", "flow"))) {
    await database.schema.alterTable("flow_requests", (table) => {
      table.jsonb("flow");
    });
  }
  if (!(await database.schema.hasColumn("flow_requests", "description"))) {
    await database.schema.alterTable("flow_requests", (table) => {
      table.text("description");
    });
  }
  if (!(await database.schema.hasColumn("flow_requests", "schema"))) {
    await database.schema.alterTable("flow_requests", (table) => {
      table.jsonb("schema").notNullable().defaultTo(database.raw(`'[]'::jsonb`));
    });
  }

  await database("flow_requests")
    .whereNull("flow")
    .whereNotNull("data")
    .update({ flow: database.raw("data->'flow'") });
  await database("flow_requests")
    .whereNull("description")
    .whereNotNull("data")
    .update({ description: database.raw("data->>'description'") });
  await database("flow_requests")
    .whereRaw("schema = '[]'::jsonb")
    .whereNotNull("data")
    .whereRaw("jsonb_exists(data, 'schema')")
    .update({ schema: database.raw("data->'schema'") });

  const mcpFlowsExists = await database.schema.hasTable("mcp_flows");
  if (!mcpFlowsExists) {
    await database.schema.raw(`
      CREATE TABLE mcp_flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(64) UNIQUE NOT NULL CHECK (name ~ '^[a-zA-Z0-9_-]{1,64}$'),
        description TEXT NOT NULL,
        schema JSONB NOT NULL DEFAULT '[]',
        flow_request_id UUID NOT NULL REFERENCES flow_requests(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await database.schema.raw(
      `CREATE INDEX IF NOT EXISTS idx_mcp_flows_flow_request_id ON mcp_flows(flow_request_id)`,
    );
    console.log("Table mcp_flows created successfully");
  } else {
    console.log("Table mcp_flows already exists");
  }
}

export function isWebhookMode() {
  return Deno.env.get("WEBHOOK_MODE") === "true";
}
