import { getDb } from "../db/knex.ts";

export const ERROR_STEP_NAME = "__error__";

export interface LogEntry {
  step: string;
  input?: any;
  output?: any;
}

export function buildLogs(
  steps: Record<string, any> | undefined | null,
): LogEntry[] {
  if (!steps) return [];

  return Object.keys(steps).map((key) => ({
    step: key,
    output: steps[key]?.output,
    input: steps[key]?.input,
  }));
}

export function buildErrorLog(
  requestData: any,
  error: unknown,
): LogEntry {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    step: ERROR_STEP_NAME,
    input: requestData,
    output: {
      error: {
        message: err.message,
        stack: err.stack,
      },
    },
  };
}

export async function saveFlowLogs(
  logs: LogEntry[],
  flowRequestId: string | null = null,
) {
  const db = getDb();
  const [row] = await db("flows_logs")
    .insert({
      flow_request_id: flowRequestId,
      data: JSON.stringify(logs),
    })
    .returning(["id", "flow_request_id", "executed_at"]);

  return {
    id: row?.id,
    flow_request_id: row?.flow_request_id ?? flowRequestId,
    executed_at: row?.executed_at,
    data: logs,
  };
}

export async function getLatestFlowLogs(flowRequestId: string) {
  const db = getDb();
  return db("flows_logs")
    .where("flow_request_id", flowRequestId)
    .orderBy("executed_at", "desc")
    .orderBy("id", "desc")
    .limit(10);
}
