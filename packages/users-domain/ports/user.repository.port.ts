// * User repository interface

import type { ClientSession } from 'mongodb';

import type { User } from '../domain/entities/user.entity';

export interface IUserRepository {
  save(user: User, userId?: string, session?: ClientSession): Promise<User>;
  findById(id: string, session?: ClientSession): Promise<User | null>;
  findByEmail(email: string, session?: ClientSession): Promise<User | null>;
  update(user: User, userId?: string, session?: ClientSession): Promise<User>;
  delete(id: string, userId?: string, session?: ClientSession): Promise<boolean>;
}
