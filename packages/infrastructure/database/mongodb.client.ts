// * MongoDB client with connection pooling and retry logic

import { Db, MongoClient, MongoClientOptions } from 'mongodb';

import type { Logger } from '../logging/logger';

export class MongoDBClient {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor(
    private readonly uri: string,
    private readonly dbName: string,
    private readonly logger: Logger,
    private readonly options?: MongoClientOptions
  ) {}

  async connect(): Promise<void> {
    try {
      const defaultOptions: MongoClientOptions = {
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        retryReads: true,
        ...this.options,
      };

      this.client = new MongoClient(this.uri, defaultOptions);
      await this.client.connect();
      this.db = this.client.db(this.dbName);

      this.logger.info('MongoDB connected successfully', {
        database: this.dbName,
      });
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.logger.info('MongoDB disconnected');
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.db) return false;
      await this.db.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('MongoDB ping failed', { error });
      return false;
    }
  }
}
