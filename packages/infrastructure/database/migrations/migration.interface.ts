// * Migration interface for database migrations

import type { Db } from 'mongodb';

export interface Migration {
  // * Unique migration identifier (format: YYYYMMDD_NNN_description)
  readonly id: string;

  // * Human-readable description
  readonly description: string;

  // * Apply migration (create indexes, collections, etc.)
  up(db: Db): Promise<void>;

  // * Rollback migration (drop indexes, collections, etc.)
  down(db: Db): Promise<void>;
}

export interface MigrationRecord {
  _id: string; // * Migration ID
  description: string;
  appliedAt: Date;
  status: 'completed' | 'failed' | 'running';
  error?: string;
  executionTimeMs?: number;
}

export interface MigrationStatus {
  id: string;
  description: string;
  applied: boolean;
  appliedAt?: Date;
  status?: 'completed' | 'failed' | 'running';
}