export interface ScheduledFlow {
  id: string | number;
  flow_request_id: string;
  flow_name: string;
  cron_expression: string;
  created_at: string;
  next_execution_at: string;
}

export interface CreateScheduledFlowPayload {
  flow_request_id: string;
  cron_expression: string;
}
