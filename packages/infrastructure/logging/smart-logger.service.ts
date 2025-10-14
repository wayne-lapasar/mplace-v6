// * Smart logger service with multiple transports

import { ulid } from 'ulid';

import type { ILogTransport } from './transport.port';
import type {
  BaseLogEntry,
  ErrorLogEntry,
  LogEntry,
  LoggerConfig,
  LogLevel,
  PerformanceLogEntry,
  RequestLogEntry,
  SecurityLogEntry,
} from './types';

export class SmartLogger {
  private transports: ILogTransport[] = [];
  private config: LoggerConfig;

  constructor(config: LoggerConfig, transports: ILogTransport[] = []) {
    this.config = config;
    this.transports = transports;
  }

  // * Add a transport
  addTransport(transport: ILogTransport): void {
    this.transports.push(transport);
  }

  // * Remove a transport
  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name);
  }

  // * General logging methods
  async debug(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.log('debug', 'general', message, context);
  }

  async error(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.log('error', 'general', message, context);
  }

  async info(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.log('info', 'general', message, context);
  }

  async warn(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.log('warn', 'general', message, context);
  }

  // * Specialized logging methods
  async logRequest(data: Omit<RequestLogEntry, keyof BaseLogEntry> & { source?: BaseLogEntry['source'] }): Promise<void> {
    const base = this.createBaseEntry('info', 'request');
    const entry: RequestLogEntry = {
      ...base,
      type: 'request',
      source: data.source,
      request: data.request,
      response: data.response,
      user: data.user,
      performance: data.performance,
      message: data.response
        ? `${data.request.method} ${data.request.path} ${data.response.statusCode} ${data.response.duration}ms`
        : `${data.request.method} ${data.request.path}`,
    };

    await this.writeToTransports(entry);
  }

  async logError(error: Error, context?: Record<string, unknown>): Promise<void> {
    const base = this.createBaseEntry('error', 'error');
    const entry: ErrorLogEntry = {
      ...base,
      type: 'error',
      level: 'error',
      context,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      message: `Error: ${error.message}`,
    };

    await this.writeToTransports(entry);
  }

  async logPerformance(data: Omit<PerformanceLogEntry, keyof BaseLogEntry>): Promise<void> {
    const level = data.operation.duration > (data.operation.threshold || 1000) ? 'warn' : 'info';
    const base = this.createBaseEntry(level, 'performance');

    const entry: PerformanceLogEntry = {
      ...base,
      type: 'performance',
      operation: data.operation,
      metadata: data.metadata,
      alert: data.alert,
      metrics: data.metrics,
      message: `${data.operation.type} operation "${data.operation.name}" took ${data.operation.duration}ms`,
    };

    await this.writeToTransports(entry);
  }

  async logSecurity(data: Omit<SecurityLogEntry, keyof BaseLogEntry>): Promise<void> {
    const levelMap = {
      critical: 'error' as const,
      high: 'error' as const,
      low: 'info' as const,
      medium: 'warn' as const,
    };

    const base = this.createBaseEntry(levelMap[data.severity], 'security');
    const entry: SecurityLogEntry = {
      ...base,
      type: 'security',
      event: data.event,
      severity: data.severity,
      actor: data.actor,
      details: data.details,
      threat: data.threat,
      message: `Security event: ${data.event}`,
    };

    await this.writeToTransports(entry);
  }

  // * Create a child logger with additional context
  child(_bindings: Record<string, unknown>): SmartLogger {
    // * For now, return the same logger
    // ? Can be enhanced to add permanent bindings
    return this;
  }

  // * Cleanup all transports
  async close(): Promise<void> {
    await Promise.all(this.transports.map((t) => t.close?.()));
  }

  private async log(
    level: LogLevel,
    type: 'general',
    message: string,
    _context?: Record<string, unknown>
  ): Promise<void> {
    const entry: LogEntry = {
      ...this.createBaseEntry(level, type),
      message,
    };

    await this.writeToTransports(entry);
  }

  private async writeToTransports(entry: LogEntry): Promise<void> {
    const writes = this.transports.map((transport) =>
      transport.log(entry).catch((error) => {
        console.error(`Transport ${transport.name} failed:`, error);
      })
    );

    await Promise.all(writes);
  }

  private createBaseEntry(level: LogLevel, type: LogEntry['type']): BaseLogEntry {
    return {
      correlationId: ulid(),
      environment: this.config.environment,
      hostname: process.env.HOSTNAME || 'unknown',
      level,
      message: '',
      service: this.config.service,
      timestamp: new Date(),
      type,
      version: this.config.version,
    };
  }
}