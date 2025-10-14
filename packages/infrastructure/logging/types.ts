// * Log types and interfaces for smart logging

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogType = 'request' | 'error' | 'performance' | 'security' | 'general';

export type RequestSource = 'web' | 'mobile' | 'microservice' | 'cli' | 'cron' | 'webhook' | 'unknown';

export interface BaseLogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  type: LogType;
  source?: RequestSource;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  environment?: string;
  service?: string;
  version?: string;
  hostname?: string;
}

// * Request log entry
export interface RequestLogEntry extends BaseLogEntry {
  type: 'request';
  request: {
    method: string;
    path: string;
    query?: Record<string, unknown>;
    headers?: Record<string, string>;
    ip?: string;
    userAgent?: string;
  };
  response?: {
    statusCode: number;
    duration: number;
    size?: number;
  };
  user?: {
    id: string;
    email?: string;
  };
  performance?: {
    databaseQueries?: number;
    databaseTime?: number;
    cacheHits?: number;
    cacheMisses?: number;
  };
}

// * Error log entry
export interface ErrorLogEntry extends BaseLogEntry {
  type: 'error';
  level: 'error';
  error: {
    name: string;
    message: string;
    code?: string;
    statusCode?: number;
    stack?: string;
    translationKey?: string;
  };
  context?: Record<string, unknown>;
  user?: {
    id: string;
    email?: string;
  };
  request?: {
    method: string;
    path: string;
  };
}

// * Performance log entry
export interface PerformanceLogEntry extends BaseLogEntry {
  type: 'performance';
  operation: {
    name: string;
    type: 'database' | 'cache' | 'http' | 'computation';
    duration: number;
    threshold?: number;
  };
  metadata?: {
    query?: string;
    params?: Record<string, unknown>;
  };
  alert?: {
    level: 'warning' | 'critical';
    reason: string;
    recommendations?: string[];
  };
  metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    activeConnections?: number;
  };
}

// * Security log entry
export interface SecurityLogEntry extends BaseLogEntry {
  type: 'security';
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actor?: {
    id?: string;
    email?: string;
    ip: string;
    userAgent?: string;
  };
  details: Record<string, unknown>;
  threat?: {
    score: number;
    indicators: string[];
    action?: string;
  };
}

export type LogEntry =
  | RequestLogEntry
  | ErrorLogEntry
  | PerformanceLogEntry
  | SecurityLogEntry
  | BaseLogEntry;

// * Transport configuration
export interface TransportConfig {
  enabled: boolean;
  level: LogLevel;
}

export interface FileTransportConfig extends TransportConfig {
  path: string;
  maxSize: string;
  maxFiles: number;
  compress?: boolean;
}

export interface MongoDBTransportConfig extends TransportConfig {
  collection: string;
  ttl?: number;
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  version: string;
  environment: string;
  transports: {
    console?: TransportConfig;
    file?: FileTransportConfig;
    mongodb?: MongoDBTransportConfig;
  };
}
