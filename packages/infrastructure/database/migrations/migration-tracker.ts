// * Tracks which migrations have been applied

import type { Collection,Db } from 'mongodb';

import type { MigrationRecord, MigrationStatus } from './migration.interface';

export class MigrationTracker {
  private readonly collectionName = 'migrations';
  private collection!: Collection<MigrationRecord>;

  constructor(private readonly db: Db) {}

  // * Initialize migrations collection
  async initialize(): Promise<void> {
    this.collection = this.db.collection<MigrationRecord>(this.collectionName);

    // * Create index on appliedAt for sorting
    await this.collection.createIndex({ appliedAt: 1 });
  }

  // * Get all applied migration IDs
  async getAppliedMigrations(): Promise<string[]> {
    const records = await this.collection
      .find({ status: 'completed' })
      .sort({ appliedAt: 1 })
      .toArray();

    return records.map((r) => r._id);
  }

  // * Get detailed status of all migrations
  async getMigrationStatuses(
    availableMigrationIds: string[]
  ): Promise<MigrationStatus[]> {
    const applied = await this.collection.find().toArray();
    const appliedMap = new Map(applied.map((r) => [r._id, r]));

    return availableMigrationIds.map((id) => {
      const record = appliedMap.get(id);
      return {
        id,
        description: record?.description || '',
        applied: record?.status === 'completed',
        appliedAt: record?.appliedAt,
        status: record?.status,
      };
    });
  }

  // * Mark migration as running
  async markAsRunning(id: string, description: string): Promise<void> {
    await this.collection.insertOne({
      _id: id,
      description,
      appliedAt: new Date(),
      status: 'running',
    });
  }

  // * Mark migration as completed
  async markAsCompleted(id: string, executionTimeMs: number): Promise<void> {
    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          status: 'completed',
          executionTimeMs,
        },
      }
    );
  }

  // * Mark migration as failed
  async markAsFailed(id: string, error: string): Promise<void> {
    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          status: 'failed',
          error,
        },
      }
    );
  }

  // * Remove migration record (for rollback)
  async removeMigration(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }

  // * Get last applied migration
  async getLastAppliedMigration(): Promise<MigrationRecord | null> {
    const records = await this.collection
      .find({ status: 'completed' })
      .sort({ appliedAt: -1 })
      .limit(1)
      .toArray();

    return records[0] || null;
  }
}