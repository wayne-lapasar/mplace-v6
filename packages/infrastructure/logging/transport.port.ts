// * Transport port interface

import type { LogEntry, LogLevel } from './types';

export interface ILogTransport {
  readonly name: string;
  readonly level: LogLevel;

  // * Log a message
  log(entry: LogEntry): Promise<void>;

  // * Check if transport should log this level
  shouldLog(level: LogLevel): boolean;

  // * Close/cleanup transport
  close?(): Promise<void>;
}