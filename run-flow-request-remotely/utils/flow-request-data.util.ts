import { maybeDecryptFlowBlob } from "./crypto.util.ts";

const DEFAULT_FLOW = { data: { nodes: [], envData: [] } };

function asRecord(value: unknown): Record<string, any> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : {};
}

/**
 * Reads and decrypts both the explicit flow column and legacy
 * flow_requests.data payloads. Plaintext records remain supported for rows
 * written before encryption was introduced.
 */
export async function getFlowRequestExecutionData(
  flowRequest: Record<string, any>,
) {
  const [decryptedData, decryptedFlow] = await Promise.all([
    maybeDecryptFlowBlob(flowRequest.data),
    maybeDecryptFlowBlob(flowRequest.flow),
  ]);
  const legacyData = asRecord(decryptedData);
  const hasExplicitFlow = flowRequest.flow !== undefined &&
    flowRequest.flow !== null;
  return {
    flow: hasExplicitFlow
      ? asRecord(decryptedFlow)
      : legacyData.flow || DEFAULT_FLOW,
    plugins: Array.isArray(legacyData.plugins) ? legacyData.plugins : [],
  };
}
