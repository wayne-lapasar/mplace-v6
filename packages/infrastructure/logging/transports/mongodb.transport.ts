// * MongoDB transport for logging

import type { Collection, Db } from 'mongodb';

import type { ILogTransport } from '../transport.port';
import type { LogEntry, LogLevel, MongoDBTransportConfig } from '../types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  error: 3,
  info: 1,
  warn: 2,
};

export class MongoDBTransport implements ILogTransport {
  readonly name = 'mongodb';
  readonly level: LogLevel;
  private collection: Collection<LogEntry>;
  private config: MongoDBTransportConfig;

  constructor(db: Db, config: MongoDBTransportConfig) {
    this.level = config.level;
    this.config = config;
    this.collection = db.collection<LogEntry>(config.collection);

    // * Create indexes for better query performance
    this.createIndexes();
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.collection.insertOne(entry as any);
    } catch (error) {
      console.error('MongoDB transport error:', error);
    }
  }

  shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private async createIndexes(): Promise<void> {
    try {
      // * Index on timestamp for time-based queries
      await this.collection.createIndex({ timestamp: -1 });

      // * Index on correlationId for request tracking
      await this.collection.createIndex({ correlationId: 1 });

      // * Index on type for filtering by log type
      await this.collection.createIndex({ type: 1 });

      // * Index on level for filtering by severity
      await this.collection.createIndex({ level: 1 });

      // * TTL index for automatic log expiration
      if (this.config.ttl) {
        await this.collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: this.config.ttl });
      }

      // * Compound index for common queries
      await this.collection.createIndex({ type: 1, level: 1, timestamp: -1 });
    } catch (error) {
      console.error('Failed to create MongoDB indexes:', error);
    }
  }
}