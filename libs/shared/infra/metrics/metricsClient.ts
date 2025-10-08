export interface MetricOptions {
  tags?: Record<string, string>
}

export class MetricsClient {
  gauge(metric: string, value: number, options: MetricOptions = {}) {
    this.emit('gauge', metric, value, options)
  }

  increment(metric: string, value = 1, options: MetricOptions = {}) {
    this.emit('count', metric, value, options)
  }

  timing(metric: string, durationMs: number, options: MetricOptions = {}) {
    this.emit('timing', metric, durationMs, options)
  }

  private emit(kind: string, metric: string, value: number, options: MetricOptions) {
    // Replace with OpenTelemetry or preferred metrics backend.
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        level: 'debug',
        metric,
        value,
        kind,
        tags: options.tags,
        timestamp: new Date().toISOString(),
      })
    )
  }
}
