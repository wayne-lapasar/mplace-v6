// * Base entity class - all domain entities extend this

import type { ID, Timestamp } from '../../types/common.types';

export abstract class BaseEntity {
  readonly id: ID;
  readonly createdAt: Timestamp;
  readonly createdById: ID;
  protected updatedAt: Timestamp;
  protected updatedById: ID;

  constructor(id: ID, createdAt?: Timestamp, updatedAt?: Timestamp, createdById?: ID, updatedById?: ID) {
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.createdById = createdById ?? '';
    this.updatedById = updatedById ?? '';
  }

  // * Update the entity's timestamp
  protected touch(userId?: ID): void {
    this.updatedAt = new Date();
    this.updatedById = userId ?? this.updatedById;
  }

  // * Check if entity is the same as another
  equals(other: BaseEntity): boolean {
    return this.id === other.id;
  }
}
