import type { RuntimeConfig } from '@shared/interfaces/config'
import type { Logger } from '@shared/interfaces/logger'

class StructuredLogger implements Logger {
  constructor(private readonly context: Record<string, unknown>) {}

  info(message: string, meta: Record<string, unknown> = {}) {
    this.write('info', message, meta)
  }

  warn(message: string, meta: Record<string, unknown> = {}) {
    this.write('warn', message, meta)
  }

  error(message: string, meta: Record<string, unknown> = {}) {
    this.write('error', message, meta)
  }

  debug(message: string, meta: Record<string, unknown> = {}) {
    this.write('debug', message, meta)
  }

  child(context: Record<string, unknown>): Logger {
    return new StructuredLogger({ ...this.context, ...context })
  }

  private write(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    meta: Record<string, unknown>
  ) {
    const payload = {
      level,
      message,
      ...this.context,
      ...meta,
      timestamp: new Date().toISOString(),
    }

    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](JSON.stringify(payload))
  }
}

export function createLogger(config: RuntimeConfig): Logger {
  return new StructuredLogger({ service: config.serviceName, environment: config.env })
}
