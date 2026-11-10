import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "prom-client";
import type { MetricOptions } from "./metrics.interface.ts";

type AnyMetric = Counter | Gauge | Histogram;

class PrometheusMetricsUtil {
  private readonly registry: Registry;
  private readonly cache: Map<string, AnyMetric> = new Map();

  constructor() {
    this.registry = new Registry();
    // Collect default Node/Deno process metrics (memory, GC, event loop, etc.)
    collectDefaultMetrics({ register: this.registry });
  }

  /**
   * Returns the prom-client Registry.
   * Used by the /metrics endpoint to serialize all registered metrics.
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Returns an existing metric by name or creates and registers a new one.
   * Calling this multiple times with the same name is safe — the cached
   * instance is returned without triggering a duplicate-registration error.
   */
  getMetrics(options: MetricOptions): AnyMetric {
    const cached = this.cache.get(options.name);
    if (cached) return cached;

    const labelNames = options.labelNames ?? [];
    let metric: AnyMetric;

    if (options.type === "counter") {
      metric = new Counter({
        name: options.name,
        help: options.help,
        labelNames,
        registers: [this.registry],
      });
    } else if (options.type === "gauge") {
      metric = new Gauge({
        name: options.name,
        help: options.help,
        labelNames,
        registers: [this.registry],
      });
    } else {
      // histogram (default fallback)
      metric = new Histogram({
        name: options.name,
        help: options.help,
        labelNames,
        registers: [this.registry],
      });
    }

    this.cache.set(options.name, metric);
    return metric;
  }
}

const prometheusMetricsUtil = new PrometheusMetricsUtil();
export default prometheusMetricsUtil;
