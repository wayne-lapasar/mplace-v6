// * Request validation middleware

import { Context } from 'hono';
import { z, ZodError } from 'zod';

import { ValidationError } from '@lapasar/shared-kernel';

export function validateBody<T>(schema: z.ZodType<T>) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const body = await c.req.json();
      schema.parse(body);
      await next();
    } catch (error) {
      // * Check if it's a Zod validation error
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        throw new ValidationError('Validation failed', validationErrors);
      }

      // * Re-throw other errors (like JSON parsing errors)
      throw error;
    }
  };
}
