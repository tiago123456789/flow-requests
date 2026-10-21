import { getDb } from "../db/knex.ts";

export type DeleteFlowRequestResult = {
  id: string;
  mcpFlowsDeleted: number;
};

export async function deleteFlowRequest(
  id: string,
): Promise<DeleteFlowRequestResult | null> {
  const db = getDb();

  return await db.transaction(async (trx) => {
    const flowRequest = await trx("flow_requests")
      .where("id", id)
      .forUpdate()
      .first();

    if (!flowRequest) return null;

    const mcpFlowsDeleted = await trx("mcp_flows")
      .where("flow_request_id", id)
      .del();
    await trx("flow_requests").where("id", id).del();

    return { id, mcpFlowsDeleted };
  });
}
