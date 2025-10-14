// * Users service HTTP API

import { Hono } from 'hono';

import { ForbiddenError } from '@lapasar/shared-kernel';
import {
  LoginUserDTOSchema,
  RegisterUserDTOSchema,
  UpdateUserProfileDTOSchema,
} from '@lapasar/users-domain';
import { authMiddleware, getAuthUser } from '../../api-gateway/middleware/auth.middleware';
import { validateBody } from '../../api-gateway/middleware/validation.middleware';
import type { DIContainer } from '../../config/di-container';

export function createUsersAPI(container: DIContainer) {
  const app = new Hono();

  // * Public endpoints - no authentication required

  // * POST /users/register - Register new user (self-registration, no userId for audit)
  app.post(
    '/register',
    validateBody(RegisterUserDTOSchema),
    async (c) => {
      const dto = await c.req.json();
      const result = await container.registerUserUseCase.execute(dto, undefined);
      return c.json(result, 201);
    }
  );

  // * POST /users/login - Login user
  app.post(
    '/login',
    validateBody(LoginUserDTOSchema),
    async (c) => {
      const dto = await c.req.json();
      const result = await container.loginUserUseCase.execute(dto);
      return c.json(result);
    }
  );

  // ! Protected endpoints - authentication required

  // * GET /users/me - Get current authenticated user profile
  app.get('/me', authMiddleware(container.jwtService), async (c) => {
    const authUser = getAuthUser(c);
    const result = await container.getUserUseCase.execute(authUser.userId);
    return c.json(result);
  });

  // * PATCH /users/me - Update current user's own profile
  app.patch(
    '/me',
    authMiddleware(container.jwtService),
    validateBody(UpdateUserProfileDTOSchema),
    async (c) => {
      const authUser = getAuthUser(c);
      const dto = await c.req.json();
      const result = await container.updateUserProfileUseCase.execute(
        authUser.userId,
        dto,
        authUser.userId
      );
      return c.json(result);
    }
  );

  // * GET /users/:id - Get user by ID (only own profile or admin)
  app.get('/:id', authMiddleware(container.jwtService), async (c) => {
    const userId = c.req.param('id');
    const authUser = getAuthUser(c);

    // * Users can only view their own profile unless they're admin
    if (userId !== authUser.userId && !authUser.roles.includes('admin')) {
      throw new ForbiddenError('You can only view your own profile');
    }

    const result = await container.getUserUseCase.execute(userId);
    return c.json(result);
  });

  return app;
}
