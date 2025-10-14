// * User aggregate root

import { BaseEntity } from '@lapasar/shared-kernel';

export interface UserRole {
  name: string;
  permissions: string[];
}

export class User extends BaseEntity {
  constructor(
    id: string,
    public email: string,
    public name: string,
    public passwordHash: string,
    public roles: string[] = ['customer'],
    public isActive: boolean = true,
    createdAt?: Date,
    updatedAt?: Date,
    createdById?: string,
    updatedById?: string,
  ) {
    super(id, createdAt, updatedAt, createdById, updatedById);
  }

  activate(): void {
    this.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.isActive = false;
    this.touch();
  }

  updateProfile(name: string): void {
    this.name = name;
    this.touch();
  }

  changePassword(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash;
    this.touch();
  }

  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }
}
