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

/** Reads both the explicit flow column and legacy flow_requests.data payloads. */
export function getFlowRequestExecutionData(flowRequest: Record<string, any>) {
  const legacyData = asRecord(flowRequest.data);
  const hasExplicitFlow = flowRequest.flow !== undefined &&
    flowRequest.flow !== null;
  return {
    flow: hasExplicitFlow
      ? asRecord(flowRequest.flow)
      : legacyData.flow || DEFAULT_FLOW,
    plugins: Array.isArray(legacyData.plugins) ? legacyData.plugins : [],
  };
}
