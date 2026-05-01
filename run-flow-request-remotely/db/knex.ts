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
        data JSONB
      )
    `);
    console.log("Table flow_requests created successfully");
  } else {
    console.log("Table flow_requests already exists");
  }
}

export function isWebhookMode() {
  return Deno.env.get("WEBHOOK_MODE") === "true";
}
