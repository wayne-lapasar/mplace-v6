// * CLI tool to run database migrations

import process from 'node:process';

import type { Migration } from '@lapasar/infrastructure';
import { MigrationRunner,MongoDBClient } from '@lapasar/infrastructure';
import { PinoLoggerAdapter } from '../packages/infrastructure/logging/logger';
// * Import all migrations
import { migration as createUsersIndexes } from './migrations/20251012_001_create_users_indexes';

// * All available migrations
const migrations: Migration[] = [createUsersIndexes];

async function main() {
  const command = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');

  // * Initialize logger
  const logger = PinoLoggerAdapter.create({ level: 'info' });

  // * Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'lapasar-corp';

  const mongoClient = new MongoDBClient(mongoUri, dbName, logger);
  await mongoClient.connect();

  const db = mongoClient.getDatabase();

  // * Initialize migration runner
  const runner = new MigrationRunner(db, migrations, logger);

  try {
    switch (command) {
      case 'up':
      case 'run':
        logger.info('Running pending migrations...');
        await runner.runPending({ dryRun });
        break;

      case 'down':
      case 'rollback':
        logger.info('Rolling back last migration...');
        await runner.rollbackLast({ dryRun });
        break;

      case 'status': {
        logger.info('Checking migration status...');
        const statuses = await runner.getStatus();

        console.log('\n📊 Migration Status:\n');
        console.log('ID                                | Applied | Date');
        console.log('----------------------------------|---------|---------------------');

        for (const status of statuses) {
          const applied = status.applied ? '✅ Yes' : '❌ No';
          const date = status.appliedAt
            ? status.appliedAt.toISOString().slice(0, 19).replace('T', ' ')
            : '-';
          console.log(
            `${status.id.padEnd(33)} | ${applied.padEnd(7)} | ${date}`
          );
        }
        console.log('');
        break;
      }

      default:
        console.log('Usage: bun run migrate [command] [options]');
        console.log('');
        console.log('Commands:');
        console.log('  up, run       Run pending migrations');
        console.log('  down, rollback Roll back last migration');
        console.log('  status        Show migration status');
        console.log('');
        console.log('Options:');
        console.log('  --dry-run     Show what would happen without making changes');
        console.log('');
        console.log('Examples:');
        console.log('  bun run migrate up');
        console.log('  bun run migrate up --dry-run');
        console.log('  bun run migrate down');
        console.log('  bun run migrate status');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  } finally {
    await mongoClient.disconnect();
  }
}

main();