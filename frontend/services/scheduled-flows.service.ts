import { normalizeBaseUrl } from "@/hooks/useRemoteConfig";
import type { CreateScheduledFlowPayload, ScheduledFlow } from "@/types/scheduled-flow";

async function request<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function createScheduledFlow(
  baseUrl: string,
  apiKey: string,
  payload: CreateScheduledFlowPayload,
) {
  return request<{ schedule: ScheduledFlow }>(baseUrl, apiKey, "/scheduled-flows", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getScheduledFlows(baseUrl: string, apiKey: string) {
  return request<{ schedules: ScheduledFlow[] }>(baseUrl, apiKey, "/scheduled-flows");
}

export async function deleteScheduledFlow(
  baseUrl: string,
  apiKey: string,
  id: string | number,
) {
  return request<{ deleted: boolean; id: string }>(
    baseUrl,
    apiKey,
    `/scheduled-flows/${encodeURIComponent(String(id))}`,
    { method: "DELETE" },
  );
}
