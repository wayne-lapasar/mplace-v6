// * Logger interface and implementation using Pino

import process from 'node:process';
import pino, { Logger as PinoLogger } from 'pino';

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: Record<string, unknown>): Logger;
}

export class PinoLoggerAdapter implements Logger {
  constructor(private readonly pinoLogger: PinoLogger) {}

  debug(message: string, context?: LogContext): void {
    this.pinoLogger.debug(context, message);
  }

  info(message: string, context?: LogContext): void {
    this.pinoLogger.info(context, message);
  }

  warn(message: string, context?: LogContext): void {
    this.pinoLogger.warn(context, message);
  }

  error(message: string, context?: LogContext): void {
    this.pinoLogger.error(context, message);
  }

  child(bindings: Record<string, unknown>): Logger {
    return new PinoLoggerAdapter(this.pinoLogger.child(bindings));
  }

  static create(options?: pino.LoggerOptions): Logger {
    const logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      ...options,
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    });

    return new PinoLoggerAdapter(logger);
  }
}
