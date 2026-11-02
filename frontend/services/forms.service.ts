import { normalizeBaseUrl } from "@/hooks/useRemoteConfig";
import type { FormFlow } from "@/types/form-flow";

export async function getForms(baseUrl: string, apiKey: string) {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/forms`, {
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ forms: FormFlow[] }>;
}

export async function deleteForm(baseUrl: string, apiKey: string, formId: string) {
  const response = await fetch(
    `${normalizeBaseUrl(baseUrl)}/forms/${encodeURIComponent(formId)}`,
    {
      method: "DELETE",
      headers: { "api-key": apiKey },
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ deleted: boolean; id: string }>;
}
