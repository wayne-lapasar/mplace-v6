// * File transport with rotation

import { createWriteStream, WriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { ILogTransport } from '../transport.port';
import type { FileTransportConfig, LogEntry, LogLevel } from '../types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  error: 3,
  info: 1,
  warn: 2,
};

export class FileTransport implements ILogTransport {
  readonly name = 'file';
  readonly level: LogLevel;
  private writeStream: WriteStream | null = null;
  private config: FileTransportConfig;
  private currentSize = 0;

  constructor(config: FileTransportConfig) {
    this.level = config.level;
    this.config = config;
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return;

    try {
      // * Ensure write stream exists
      if (!this.writeStream) {
        await this.initializeStream();
      }

      // * Format log entry as JSON
      const logLine = JSON.stringify(entry) + '\n';
      const logSize = Buffer.byteLength(logLine);

      // * Check if we need to rotate
      if (this.shouldRotate(logSize)) {
        await this.rotate();
      }

      // * Write to file
      this.writeStream?.write(logLine);
      this.currentSize += logSize;
    } catch (error) {
      console.error('File transport error:', error);
    }
  }

  shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.writeStream) {
        this.writeStream.end(() => {
          this.writeStream = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private async initializeStream(): Promise<void> {
    const logDir = dirname(this.config.path);

    // * Ensure directory exists
    await mkdir(logDir, { recursive: true });

    // * Create write stream
    const logPath = this.getLogPath();
    this.writeStream = createWriteStream(logPath, { flags: 'a' });
    this.currentSize = 0;
  }

  private shouldRotate(nextLogSize: number): boolean {
    const maxSizeBytes = this.parseSize(this.config.maxSize);
    return this.currentSize + nextLogSize > maxSizeBytes;
  }

  private async rotate(): Promise<void> {
    // * Close current stream
    await this.close();

    // * Create new stream with timestamp
    await this.initializeStream();
  }

  private getLogPath(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const ext = this.config.path.split('.').pop();
    const base = this.config.path.replace(`.${ext}`, '');
    return `${base}-${timestamp}.${ext}`;
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = {
      B: 1,
      GB: 1024 * 1024 * 1024,
      KB: 1024,
      MB: 1024 * 1024,
    };

    const match = size.match(/^(\d+)(B|KB|MB|GB)$/i);
    if (!match) return 10 * 1024 * 1024; // * Default 10MB

    const [, value, unit] = match;
    return parseInt(value) * units[unit.toUpperCase()];
  }
}