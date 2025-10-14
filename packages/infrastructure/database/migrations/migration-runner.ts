// * Runs database migrations

import type { Db } from 'mongodb';

import type { Logger } from '../../logging/logger';
import type { Migration, MigrationStatus } from './migration.interface';
import { MigrationTracker } from './migration-tracker';

export interface MigrationRunnerOptions {
  dryRun?: boolean; // * Don't actually run migrations, just log what would happen
  target?: string; // * Run migrations up to this ID
}

export class MigrationRunner {
  private tracker: MigrationTracker;

  constructor(
    private readonly db: Db,
    private readonly migrations: Migration[],
    private readonly logger: Logger
  ) {
    this.tracker = new MigrationTracker(db);
  }

  // * Initialize migration system
  async initialize(): Promise<void> {
    await this.tracker.initialize();
  }

  // * Run pending migrations (up)
  async runPending(options: MigrationRunnerOptions = {}): Promise<void> {
    const { dryRun = false, target } = options;

    await this.initialize();

    // * Get applied migrations
    const applied = await this.tracker.getAppliedMigrations();
    const appliedSet = new Set(applied);

    // * Filter pending migrations
    let pending = this.migrations.filter((m) => !appliedSet.has(m.id));

    // * Sort by ID (ensures chronological order)
    pending.sort((a, b) => a.id.localeCompare(b.id));

    // * Filter up to target if specified
    if (target) {
      pending = pending.filter((m) => m.id <= target);
    }

    if (pending.length === 0) {
      this.logger.info('No pending migrations to run');
      return;
    }

    this.logger.info(`Found ${pending.length} pending migrations`, {
      migrations: pending.map((m) => m.id),
    });

    // * Run each pending migration
    for (const migration of pending) {
      await this.runMigration(migration, dryRun);
    }

    this.logger.info('All migrations completed successfully');
  }

  // * Rollback last migration (down)
  async rollbackLast(options: MigrationRunnerOptions = {}): Promise<void> {
    const { dryRun = false } = options;

    await this.initialize();

    const lastApplied = await this.tracker.getLastAppliedMigration();

    if (!lastApplied) {
      this.logger.info('No migrations to rollback');
      return;
    }

    const migration = this.migrations.find((m) => m.id === lastApplied._id);

    if (!migration) {
      throw new Error(
        `Migration ${lastApplied._id} not found in migration files`
      );
    }

    this.logger.info(`Rolling back migration: ${migration.id}`, {
      description: migration.description,
    });

    if (dryRun) {
      this.logger.info('[DRY RUN] Would rollback migration');
      return;
    }

    const startTime = Date.now();

    try {
      await migration.down(this.db);
      await this.tracker.removeMigration(migration.id);

      const duration = Date.now() - startTime;

      this.logger.info(`Migration rolled back successfully: ${migration.id}`, {
        durationMs: duration,
      });
    } catch (error) {
      this.logger.error(`Migration rollback failed: ${migration.id}`, {
        error,
      });
      throw error;
    }
  }

  // * Get migration status
  async getStatus(): Promise<MigrationStatus[]> {
    await this.initialize();

    const migrationIds = this.migrations.map((m) => m.id).sort();
    return await this.tracker.getMigrationStatuses(migrationIds);
  }

  // * Run a single migration
  private async runMigration(
    migration: Migration,
    dryRun: boolean
  ): Promise<void> {
    this.logger.info(`Running migration: ${migration.id}`, {
      description: migration.description,
    });

    if (dryRun) {
      this.logger.info('[DRY RUN] Would run migration');
      return;
    }

    const startTime = Date.now();

    try {
      // * Mark as running
      await this.tracker.markAsRunning(migration.id, migration.description);

      // * Run migration
      await migration.up(this.db);

      const executionTime = Date.now() - startTime;

      // * Mark as completed
      await this.tracker.markAsCompleted(migration.id, executionTime);

      this.logger.info(`Migration completed: ${migration.id}`, {
        executionTimeMs: executionTime,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.tracker.markAsFailed(migration.id, errorMessage);

      this.logger.error(`Migration failed: ${migration.id}`, { error });

      throw new Error(
        `Migration ${migration.id} failed: ${errorMessage}`
      );
    }
  }
}