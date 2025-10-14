// * Migration: Create users collection indexes

import type { Db } from 'mongodb';

import type { Migration } from '@lapasar/infrastructure';

export const migration: Migration = {
  id: '20251012_001_create_users_indexes',
  description: 'Create indexes for users collection (email unique)',

  async up(db: Db): Promise<void> {
    const collection = db.collection('users');

    // * Create unique index on email for login and duplicate prevention
    await collection.createIndex({ email: 1 }, { unique: true });

    console.log('✅ Created unique index on users.email');
  },

  async down(db: Db): Promise<void> {
    const collection = db.collection('users');

    // * Drop the email index
    await collection.dropIndex('email_1');

    console.log('✅ Dropped unique index on users.email');
  },
};