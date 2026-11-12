import knex from "knex";
import { getEncryptKey } from "../utils/crypto.util.ts";

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
  // Validate ENCRYPT_KEY early so the server fails loudly before it starts
  // serving requests rather than failing silently on the first save or run.
  await getEncryptKey();

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

  const formsFlowsExists = await database.schema.hasTable("forms_flows");
  if (!formsFlowsExists) {
    await database.schema.raw(`
      CREATE TABLE forms_flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        flow_request_id UUID NOT NULL REFERENCES flow_requests(id) ON DELETE CASCADE,
        description VARCHAR(150) NOT NULL DEFAULT ''
      )
    `);
    await database.schema.raw(
      `CREATE INDEX IF NOT EXISTS idx_forms_flows_flow_request_id ON forms_flows(flow_request_id)`,
    );
    console.log("Table forms_flows created successfully");
  } else {
    console.log("Table forms_flows already exists");
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

  const scheduledFlowsExists = await database.schema.hasTable("scheduled_flows");
  if (!scheduledFlowsExists) {
    await database.schema.raw(`
      CREATE TABLE scheduled_flows (
        id BIGSERIAL PRIMARY KEY,
        cron_expression VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        next_execution_at TIMESTAMPTZ NOT NULL,
        flow_request_id UUID NOT NULL
          REFERENCES flow_requests(id) ON DELETE CASCADE
      )
    `);
    console.log("Table scheduled_flows created successfully");
  } else {
    console.log("Table scheduled_flows already exists");
  }
  await database.schema.raw(
    `CREATE INDEX IF NOT EXISTS idx_scheduled_flows_next_execution_at ON scheduled_flows(next_execution_at)`,
  );

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

  const mcpGroupsExists = await database.schema.hasTable("mcp_groups");
  if (!mcpGroupsExists) {
    await database.schema.raw(`
      CREATE TABLE mcp_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        jwt_token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT mcp_groups_name_not_blank CHECK (length(trim(name)) > 0)
      )
    `);
    console.log("Table mcp_groups created successfully");
  } else {
    console.log("Table mcp_groups already exists");
  }

  const mcpGroupToolsExists = await database.schema.hasTable("mcp_group_tools");
  if (!mcpGroupToolsExists) {
    await database.schema.raw(`
      CREATE TABLE mcp_group_tools (
        group_id UUID NOT NULL
          REFERENCES mcp_groups(id) ON DELETE CASCADE,
        tool_name VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        PRIMARY KEY (group_id, tool_name),
        CONSTRAINT mcp_group_tools_name_not_blank CHECK (length(trim(tool_name)) > 0)
      )
    `);
    await database.schema.raw(
      `CREATE INDEX IF NOT EXISTS idx_mcp_group_tools_tool_name ON mcp_group_tools(tool_name)`,
    );
    console.log("Table mcp_group_tools created successfully");
  } else {
    console.log("Table mcp_group_tools already exists");
  }

  const flowsLogsExists = await database.schema.hasTable("flows_logs");
  if (!flowsLogsExists) {
    await database.schema.raw(`
      CREATE TABLE flows_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flow_request_id UUID REFERENCES flow_requests(id) ON DELETE SET NULL,
        data JSONB NOT NULL DEFAULT '[]'::jsonb,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await database.schema.raw(
      `CREATE INDEX IF NOT EXISTS idx_flows_logs_flow_request_id ON flows_logs(flow_request_id)`,
    );
    await database.schema.raw(
      `CREATE INDEX IF NOT EXISTS idx_flows_logs_executed_at ON flows_logs(executed_at)`,
    );
    console.log("Table flows_logs created successfully");
  } else {
    console.log("Table flows_logs already exists");
  }
}

export function isWebhookMode() {
  return Deno.env.get("WEBHOOK_MODE") === "true";
}
