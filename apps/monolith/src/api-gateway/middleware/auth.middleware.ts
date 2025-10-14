// * JWT authentication middleware

import { Context, Next } from 'hono';

import type { JWTService } from '@lapasar/infrastructure';
import { UnauthorizedError } from '@lapasar/shared-kernel';

// * Extend Hono context to include authenticated user
export interface AuthenticatedContext extends Context {
  user?: {
    userId: string;
    email: string;
    roles: string[];
  };
}

export function authMiddleware(jwtService: JWTService) {
  return async (c: Context, next: Next) => {
    try {
      // * Extract token from Authorization header
      const authHeader = c.req.header('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7); // * Remove 'Bearer ' prefix

      // * Verify JWT token
      const payload = await jwtService.verify(token);

      // * Attach user info to context
      (c as AuthenticatedContext).user = {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles,
      };

      await next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      // * JWT verification failed
      throw new UnauthorizedError('Invalid or expired token');
    }
  };
}

// * Helper to get authenticated user from context
export function getAuthUser(c: Context): { userId: string; email: string; roles: string[] } {
  const user = (c as AuthenticatedContext).user;

  if (!user) {
    throw new UnauthorizedError('User not authenticated');
  }

  return user;
}

// * Role-based authorization middleware
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = getAuthUser(c);

    const hasRole = allowedRoles.some(role => user.roles.includes(role));

    if (!hasRole) {
      throw new UnauthorizedError(`Requires one of roles: ${allowedRoles.join(', ')}`);
    }

    await next();
  };
}