// * CLI tool to create a new migration file

import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

function generateMigrationId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

function generateMigrationTemplate(id: string, description: string): string {
  return `// * Migration: ${description.replace(/_/g, ' ')}

import type { Migration } from '@lapasar/infrastructure';
import type { Db } from 'mongodb';

export const migration: Migration = {
  id: '${id}',
  description: '${description.replace(/_/g, ' ')}',

  async up(db: Db): Promise<void> {
    // * TODO: Implement migration up logic
    // * Example: Create indexes, add collections, etc.

    throw new Error('Migration not implemented: ${id}');
  },

  async down(db: Db): Promise<void> {
    // * TODO: Implement migration down logic (rollback)
    // * Example: Drop indexes, remove collections, etc.

    throw new Error('Migration rollback not implemented: ${id}');
  },
};
`;
}

function main() {
  const description = process.argv[2];

  if (!description) {
    console.log('Usage: bun run create-migration <description>');
    console.log('');
    console.log('Example:');
    console.log('  bun run create-migration add_product_name_index');
    console.log('  bun run create-migration create_orders_collection');
    process.exit(1);
  }

  // * Generate migration ID with sequence number
  const datePrefix = generateMigrationId();

  // * Count existing migrations with the same date prefix
  const migrationsDir = join(__dirname, 'migrations');

  let sequence = 1;
  if (existsSync(migrationsDir)) {
    const files = readdirSync(migrationsDir);
    const sameDateMigrations = files.filter((f: string) =>
      f.startsWith(datePrefix)
    );
    sequence = sameDateMigrations.length + 1;
  }

  const sequenceStr = String(sequence).padStart(3, '0');
  const migrationId = `${datePrefix}_${sequenceStr}_${description}`;
  const fileName = `${migrationId}.ts`;
  const filePath = join(migrationsDir, fileName);

  // * Generate migration template
  const content = generateMigrationTemplate(migrationId, description);

  // * Write file
  writeFileSync(filePath, content);

  console.log('✅ Migration created successfully!');
  console.log('');
  console.log(`📁 File: ${filePath}`);
  console.log(`🆔 ID: ${migrationId}`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. Edit ${fileName} and implement up() and down() methods`);
  console.log('2. Import the migration in scripts/migrate.ts');
  console.log('3. Run: bun run migrate up');
}

main();