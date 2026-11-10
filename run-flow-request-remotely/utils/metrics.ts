import type { MetricOptions } from "./metrics.interface.ts";
import prometheusMetricsUtil from "./prometheus-metrics.util.ts";
import type { Counter, Gauge, Histogram } from "prom-client";

/**
 * Method decorator for Counter and Gauge metrics.
 *
 * Counter: increments by 1 after the method returns.
 * Gauge:   increments by result[options.resultKey] (or 1) after the method returns.
 *
 * @example
 * \@Metric({ name: "jobs_processed_total", help: "Total jobs processed", type: "counter" })
 * processJob() { ... }
 */
function Metric(options: MetricOptions) {
  return function (
    originalMethod: any,
    _context: ClassMethodDecoratorContext,
  ) {
    if (options.type === "counter") {
      const counter = prometheusMetricsUtil.getMetrics(options) as Counter;

      return function (this: any, ...args: any[]) {
        const result = originalMethod.call(this, ...args);
        counter.inc(options.labels || {});
        return result;
      };
    }

    if (options.type === "gauge") {
      const gauge = prometheusMetricsUtil.getMetrics(options) as Gauge;

      return function (this: any, ...args: any[]) {
        const result = originalMethod.call(this, ...args);
        const keyValue = result[options.resultKey as string];
        if (keyValue) {
          gauge.inc(options.labels || {}, result[options.resultKey as string]);
        } else {
          gauge.inc(options.labels || {});
        }
        return result;
      };
    }
  };
}

/**
 * Method decorator for Histogram metrics.
 * Wraps the method in a timer: starts before execution, ends in a finally block.
 *
 * @example
 * \@MetricHistogram({ name: "flow_execution_duration_seconds", help: "Flow execution duration", type: "histogram" })
 * async executeFlow() { ... }
 */
function MetricHistogram(options: MetricOptions) {
  return function (
    originalMethod: any,
    _context: ClassMethodDecoratorContext,
  ) {
    return async function (this: any, ...args: any[]) {
      const histogram = prometheusMetricsUtil.getMetrics({
        ...options,
        type: "histogram",
      }) as Histogram;

      const end = histogram.startTimer(options.labels || {});

      try {
        const result = await originalMethod.call(this, ...args);
        return result;
      } finally {
        end();
      }
    };
  };
}

/**
 * Functional alternative to the decorators for use outside of classes.
 * Wraps an async callback and records the appropriate metric on completion.
 *
 * @example — counter
 * const result = await track({ name: "requests_total", help: "...", type: "counter" }, () => fetchData());
 *
 * @example — histogram
 * const result = await track({ name: "request_duration_seconds", help: "...", type: "histogram" }, () => fetchData());
 */
async function track(
  options: MetricOptions,
  callback: () => any,
): Promise<any> {
  if (options.type === "counter") {
    const counter = prometheusMetricsUtil.getMetrics(options) as Counter;
    const results = await callback();
    counter.inc(options.labels || {});
    return results;
  }

  if (options.type === "gauge") {
    const gauge = prometheusMetricsUtil.getMetrics(options) as Gauge;
    const results = await callback();
    const keyValue = results[options.resultKey as string];
    if (keyValue) {
      gauge.inc(options.labels || {}, results[options.resultKey as string]);
    } else {
      gauge.inc(options.labels || {});
    }
    return results;
  }

  // histogram (default)
  const histogram = prometheusMetricsUtil.getMetrics({
    ...options,
    type: "histogram",
  }) as Histogram;
  const end = histogram.startTimer(options.labels || {});

  try {
    const result = await callback();
    return result;
  } finally {
    end();
  }
}

export { Metric, MetricHistogram, track };
