// * MongoDB user repository implementation

import type { ClientSession,Db } from 'mongodb';

import type { Logger } from '@lapasar/infrastructure';
import { BaseRepository } from '@lapasar/infrastructure';
import { User } from '../../domain/entities/user.entity';
import type { IUserRepository } from '../../ports/user.repository.port';

interface UserDocument {
  _id?: string;
  email: string;
  name: string;
  passwordHash: string;
  roles: string[];
  isActive?: boolean;
  createdAt?: Date;
  createdById?: string;
  updatedAt?: Date;
  updatedById?: string;
  deletedAt?: Date;
  deletedById?: string;
}

// * Concrete implementation of BaseRepository for UserDocument
class UserDocumentRepository extends BaseRepository<UserDocument> {
  constructor(db: Db, logger: Logger) {
    super(db, 'users', logger);
  }
}

export class UserRepository implements IUserRepository {
  private baseRepo: UserDocumentRepository;

  constructor(db: Db, logger: Logger) {
    this.baseRepo = new UserDocumentRepository(db, logger);
    // * Indexes are managed by migration system (see scripts/migrations/)
  }

  async save(user: User, userId?: string, session?: ClientSession): Promise<User> {
    const saved = await this.baseRepo.save(this.toDocument(user), userId, session);
    return this.toDomain(saved);
  }

  async findById(id: string, session?: ClientSession): Promise<User | null> {
    const doc = await this.baseRepo.findById(id, undefined, session);
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(
    email: string,
    session?: ClientSession
  ): Promise<User | null> {
    const doc = await this.baseRepo.findOne({ email }, undefined, session);
    return doc ? this.toDomain(doc) : null;
  }

  async update(user: User, userId?: string, session?: ClientSession): Promise<User> {
    const updated = await this.baseRepo.update(
      user.id,
      {
        $set: this.toDocument(user),
      },
      userId,
      session
    );
    return updated ? this.toDomain(updated) : user;
  }

  async delete(id: string, userId?: string, session?: ClientSession): Promise<boolean> {
    return this.baseRepo.delete(id, userId, session);
  }

  private toDocument(user: User): Omit<UserDocument, 'deletedAt' | 'deletedById'> {
    return {
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      roles: user.roles,
      isActive: user.isActive,
      ...(user.createdAt ? { createdAt: user.createdAt } : {}),
      ...(user.createdById ? { createdById: user.createdById } : {}),
    };
  }

  private toDomain(doc: UserDocument): User {
    return new User(
      doc._id!,
      doc.email,
      doc.name,
      doc.passwordHash,
      doc.roles,
      doc.isActive!,
      doc.createdAt,
      doc.updatedAt,
      doc.createdById,
      doc.updatedById,
    );
  }
}
