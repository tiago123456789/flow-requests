import { createPostgresBackend, Queue, Worker } from "bullmq";
import { Cron } from "croner";
import { getDb } from "./db/knex.ts";
import { getFlowRequestExecutionData } from "./utils/flow-request-data.util.ts";
import { run } from "./utils/execute-flow.util.ts";

const SCHEDULER_QUEUE = "execute-scheduler";
const FLOW_QUEUE = "flow-request-scheduled";
const SCHEDULER_ID = "poll-due-scheduled-flows";
type ScheduledQueue = Queue<any, any, string, any, any, string, any, any>;

function getQueueOptions() {
  const connectionString = Deno.env.get("QUEUE_DB_URL");
  if (!connectionString) {
    throw new Error(
      "QUEUE_DB_URL must be set to start the scheduled-flow workers",
    );
  }

  return {
    connection: {
      connectionString,
      schema: "public",
      migrate: true,
    },
  };
}

async function enqueueDueFlows(flowQueue: ScheduledQueue) {
  const db = getDb();

  await db.transaction(async (trx) => {
    const dueSchedules = await trx("scheduled_flows")
      .select("id", "flow_request_id", "cron_expression", "next_execution_at")
      .where("next_execution_at", "<=", trx.fn.now())
      .orderBy("next_execution_at", "asc")
      .limit(100)
      .forUpdate()
      .skipLocked();

    for (const schedule of dueSchedules) {
      const cron = new Cron(schedule.cron_expression, { timezone: "UTC" });
      const nextExecution = cron.nextRuns(1, new Date())[0];
      if (!nextExecution || Number.isNaN(nextExecution.getTime())) {
        throw new Error(
          `Cron expression has no next run (schedule ${schedule.id})`,
        );
      }

      const scheduledAt = new Date(schedule.next_execution_at).getTime();
      await flowQueue.add(
        "run-scheduled-flow",
        { flowRequestId: schedule.flow_request_id },
        {
          // Retain recent completed IDs so a rolled-back transaction can
          // safely retry publishing the same occurrence.
          jobId: `scheduled-${schedule.id}-${scheduledAt}`,
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: { count: 10000 },
        },
      );

      await trx("scheduled_flows")
        .where("id", schedule.id)
        .update({ next_execution_at: nextExecution });
    }
  });
}

export async function startScheduler() {
  const queueOptions = getQueueOptions();
  const schedulerQueue = new Queue(
    SCHEDULER_QUEUE,
    queueOptions,
    createPostgresBackend,
  );
  const flowQueue = new Queue(FLOW_QUEUE, queueOptions, createPostgresBackend);

  const schedulerWorker = new Worker(
    SCHEDULER_QUEUE,
    async () => enqueueDueFlows(flowQueue),
    queueOptions,
    createPostgresBackend,
  );

  const flowWorker = new Worker(
    FLOW_QUEUE,
    async (job) => {
      const flowRequestId = job.data?.flowRequestId;
      if (typeof flowRequestId !== "string" || !flowRequestId) {
        throw new Error("Scheduled job is missing its flowRequestId");
      }

      const db = getDb();
      const flowRequest = await db("flow_requests")
        .where("id", flowRequestId)
        .first();

      if (!flowRequest) {
        console.warn(
          `Skipping scheduled execution: flow request ${flowRequestId} was not found`,
        );
        return;
      }

      const flowData = await getFlowRequestExecutionData(flowRequest);
      await run({}, {}, {}, flowData.plugins, flowData.flow, flowRequestId, flowRequest.name ?? null);
    },
    queueOptions,
    createPostgresBackend,
  );

  schedulerWorker.on("failed", (job, error) => {
    console.error(
      `Scheduled-flow polling job ${job?.id ?? "unknown"} failed:`,
      error,
    );
  });
  flowWorker.on("failed", (job, error) => {
    console.error(`Scheduled flow job ${job?.id ?? "unknown"} failed:`, error);
  });

  await schedulerQueue.upsertJobScheduler(
    SCHEDULER_ID,
    { pattern: "*/5 * * * * *" },
    {
      name: "poll-due-scheduled-flows",
      data: {},
      opts: { attempts: 3, backoff: { type: "exponential", delay: 1000 } },
    },
  );

  console.log("Scheduled-flow queue workers started");
}
