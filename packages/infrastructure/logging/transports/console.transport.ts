// * Console transport for logging

import pino from 'pino';

import type { ILogTransport } from '../transport.port';
import type {
  ErrorLogEntry,
  LogEntry,
  LogLevel,
  PerformanceLogEntry,
  RequestLogEntry,
  SecurityLogEntry,
  TransportConfig,
} from '../types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  error: 3,
  info: 1,
  warn: 2,
};

export class ConsoleTransport implements ILogTransport {
  readonly name = 'console';
  readonly level: LogLevel;
  private pinoLogger: pino.Logger;

  constructor(config: TransportConfig) {
    this.level = config.level;

    this.pinoLogger = pino({
      level: this.level,
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'SYS:standard',
              },
              target: 'pino-pretty',
            }
          : undefined,
    });
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return;

    const logData = {
      correlationId: entry.correlationId,
      environment: entry.environment,
      hostname: entry.hostname,
      service: entry.service,
      spanId: entry.spanId,
      timestamp: entry.timestamp,
      traceId: entry.traceId,
      type: entry.type,
      version: entry.version,
      ...this.getTypeSpecificData(entry),
    };

    this.pinoLogger[entry.level](logData, entry.message);
  }

  shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private getTypeSpecificData(entry: LogEntry): Record<string, unknown> {
    switch (entry.type) {
      case 'request': {
        const requestEntry = entry as RequestLogEntry;
        return {
          method: requestEntry.request.method,
          path: requestEntry.request.path,
          response: requestEntry.response,
          user: requestEntry.user,
        };
      }
      case 'error': {
        const errorEntry = entry as ErrorLogEntry;
        return {
          context: errorEntry.context,
          error: errorEntry.error,
          request: errorEntry.request,
          user: errorEntry.user,
        };
      }
      case 'performance': {
        const perfEntry = entry as PerformanceLogEntry;
        return {
          alert: perfEntry.alert,
          metadata: perfEntry.metadata,
          metrics: perfEntry.metrics,
          operation: perfEntry.operation,
        };
      }
      case 'security': {
        const securityEntry = entry as SecurityLogEntry;
        return {
          actor: securityEntry.actor,
          details: securityEntry.details,
          event: securityEntry.event,
          severity: securityEntry.severity,
          threat: securityEntry.threat,
        };
      }
      default:
        return {};
    }
  }
}
