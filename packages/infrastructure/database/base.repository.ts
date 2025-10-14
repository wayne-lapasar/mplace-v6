// * Base repository with common CRUD operations and audit trail

import {
  ClientSession,
  Collection,
  Db,
  Filter,
  FindOptions,
  OptionalUnlessRequiredId,
  UpdateFilter,
} from 'mongodb';
import { ulid } from 'ulid';

import type { Logger } from '../logging/logger';

export interface AuditTrail {
  before?: unknown;
  after?: unknown;
  changedBy?: string;
  changedAt: Date;
  operation: 'create' | 'update' | 'delete' | 'restore';
}

export interface BaseDocument {
  _id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  deletedAt?: Date;
  deletedById?: string;
}

export interface QueryOptions {
  includeDeleted?: boolean;
}

export abstract class BaseRepository<T extends { _id?: string }> {
  protected collection: Collection<T>;
  private auditCollection: Collection<AuditTrail>;

  constructor(
    protected readonly db: Db,
    protected readonly collectionName: string,
    protected readonly logger: Logger
  ) {
    this.collection = db.collection<T>(collectionName);
    this.auditCollection = db.collection<AuditTrail>(`${collectionName}_audit`);
  }

  async findById(
    id: string,
    options?: QueryOptions,
    session?: ClientSession
  ): Promise<T | null> {
    const filter = this.addSoftDeleteFilter(
      { _id: id } as Filter<T>,
      options?.includeDeleted
    );
    return this.collection.findOne(filter, { session }) as Promise<T | null>;
  }

  async findAll(
    filter: Filter<T> = {},
    options?: FindOptions<T> & QueryOptions,
    session?: ClientSession
  ): Promise<T[]> {
    const filterWithSoftDelete = this.addSoftDeleteFilter(
      filter,
      options?.includeDeleted
    );
    return this.collection
      .find(filterWithSoftDelete, { ...options, session })
      .toArray() as Promise<T[]>;
  }

  async findOne(
    filter: Filter<T>,
    options?: FindOptions<T> & QueryOptions,
    session?: ClientSession
  ): Promise<T | null> {
    const filterWithSoftDelete = this.addSoftDeleteFilter(
      filter,
      options?.includeDeleted
    );
    return this.collection.findOne(filterWithSoftDelete, {
      ...options,
      session,
    }) as Promise<T | null>;
  }

  async save(
    document: OptionalUnlessRequiredId<T>,
    userId?: string,
    session?: ClientSession
  ): Promise<T> {
    const now = new Date();

    // * Set defaults for base fields, but allow override if provided
    const docWithDefaults = {
      _id: ulid(),
      isActive: true,
      createdAt: now,
      createdById: userId,
      updatedAt: now,
      ...document, // * Override defaults with any provided values
    } as OptionalUnlessRequiredId<T>;

    const result = await this.collection.insertOne(docWithDefaults, {
      session,
    });

    // * Audit trail
    const savedDoc = { ...docWithDefaults, _id: result.insertedId as string } as T;

    await this.createAuditTrail(
      {
        after: savedDoc,
        changedBy: userId,
        changedAt: now,
        operation: 'create',
      },
      session
    );

    return savedDoc;
  }

  async update(
    id: string,
    update: UpdateFilter<T>,
    userId?: string,
    session?: ClientSession
  ): Promise<T | null> {
    const before = await this.findById(id, undefined, session);

    if (!before) return null;

    const now = new Date();
    const updateWithSystemInfo = {
      ...update,
      $set: {
        ...(update.$set || {}),
        updatedAt: now,
        updatedById: userId,
      } as unknown as Partial<T>,
    } as UpdateFilter<T>;

    const result = await this.collection.findOneAndUpdate(
      { _id: id } as Filter<T>,
      updateWithSystemInfo,
      { returnDocument: 'after', session }
    );
    const updatedDoc = result as T | null;

    if (updatedDoc) {
      // * Audit trail
      await this.createAuditTrail(
        {
          before,
          after: updatedDoc,
          changedBy: userId,
          changedAt: now,
          operation: 'update',
        },
        session
      );
    }

    return updatedDoc;
  }

  // * Soft delete - marks record as deleted
  async delete(
    id: string,
    userId?: string,
    session?: ClientSession
  ): Promise<boolean> {
    const before = await this.findById(id, undefined, session);
    if (!before) return false;

    const now = new Date();
    const result = await this.collection.findOneAndUpdate(
      { _id: id } as Filter<T>,
      {
        $set: {
          deletedAt: now,
          deletedById: userId,
          updatedAt: now,
        } as unknown as Partial<T>,
      } as UpdateFilter<T>,
      { returnDocument: 'after', session }
    );

    if (result) {
      // * Audit trail
      await this.createAuditTrail(
        {
          before,
          after: result as T,
          changedBy: userId,
          changedAt: now,
          operation: 'delete',
        },
        session
      );
    }

    return result !== null;
  }

  // * Restore soft-deleted record
  async restore(
    id: string,
    userId?: string,
    session?: ClientSession
  ): Promise<boolean> {
    const before = await this.findById(id, { includeDeleted: true }, session);
    if (!before) return false;

    const now = new Date();
    const result = await this.collection.findOneAndUpdate(
      { _id: id } as Filter<T>,
      {
        $unset: { deletedAt: '', deletedById: '' } as unknown as Partial<T>,
        $set: { updatedAt: now } as unknown as Partial<T>,
      } as UpdateFilter<T>,
      { returnDocument: 'after', session }
    );

    if (result) {
      // * Audit trail
      await this.createAuditTrail(
        {
          before,
          after: result as T,
          changedBy: userId,
          changedAt: now,
          operation: 'restore',
        },
        session
      );
    }

    return result !== null;
  }

  // * Permanently delete record from database
  async hardDelete(
    id: string,
    userId?: string,
    session?: ClientSession
  ): Promise<boolean> {
    const before = await this.findById(id, { includeDeleted: true }, session);
    if (!before) return false;

    const result = await this.collection.deleteOne({ _id: id } as Filter<T>, {
      session,
    });

    if (result.deletedCount > 0) {
      // * Audit trail
      await this.createAuditTrail(
        {
          before,
          changedBy: userId,
          changedAt: new Date(),
          operation: 'delete',
        },
        session
      );
    }

    return result.deletedCount > 0;
  }

  async count(
    filter: Filter<T> = {},
    options?: QueryOptions,
    session?: ClientSession
  ): Promise<number> {
    const filterWithSoftDelete = this.addSoftDeleteFilter(
      filter,
      options?.includeDeleted
    );
    return this.collection.countDocuments(filterWithSoftDelete, { session });
  }

  // * Helper to add soft delete filter
  private addSoftDeleteFilter(
    filter: Filter<T>,
    includeDeleted = false
  ): Filter<T> {
    if (includeDeleted) return filter;
    return { ...filter, deletedAt: { $exists: false } } as Filter<T>;
  }

  private async createAuditTrail(
    audit: AuditTrail,
    session?: ClientSession
  ): Promise<void> {
    try {
      await this.auditCollection.insertOne(audit, { session });
    } catch (error) {
      this.logger.error('Failed to create audit trail', { error });
    }
  }
}
