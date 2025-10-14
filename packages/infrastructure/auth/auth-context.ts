// * Authentication context - stores current user info

import { AsyncLocalStorage } from 'async_hooks';

export interface AuthContext {
  userId: string;
  email: string;
  roles: string[];
  permissions?: string[];
}

export class AuthContextHolder {
  private static context: AsyncLocalStorage<AuthContext> = new AsyncLocalStorage();

  static run<T>(context: AuthContext, fn: () => T): T {
    return this.context.run(context, fn);
  }

  static get(): AuthContext | undefined {
    return this.context.getStore();
  }

  static getUserId(): string | undefined {
    return this.get()?.userId;
  }

  static hasRole(role: string): boolean {
    const context = this.get();
    return context?.roles.includes(role) ?? false;
  }

  static hasPermission(permission: string): boolean {
    const context = this.get();
    return context?.permissions?.includes(permission) ?? false;
  }
}
