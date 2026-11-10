export interface MetricOptions {
  /** Metric name — must be unique within the registry. */
  name: string;
  /** Human-readable description shown in the Prometheus /metrics output. */
  help: string;
  /** Type of metric to create or retrieve. */
  type: "counter" | "gauge" | "histogram";
  /**
   * Label key/value pairs to pass when incrementing/observing the metric.
   * For histograms the labels are passed to startTimer().
   */
  labels?: Record<string, string>;
  /**
   * Label names that the metric is declared with.
   * Must be supplied on first use (when the metric is created).
   */
  labelNames?: string[];
  /**
   * Key of the return value to read for the gauge increment amount.
   * When set, the gauge is incremented by result[resultKey] instead of 1.
   */
  resultKey?: string;
}
