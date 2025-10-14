// * Zod validation helper

import { ZodError,ZodSchema } from 'zod';

import { ValidationError } from '@lapasar/shared-kernel';

export class ZodValidator {
  static validate<T>(schema: ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    }
  }

  static validateAsync<T>(schema: ZodSchema<T>, data: unknown): Promise<T> {
    return schema.parseAsync(data).catch((error) => {
      if (error instanceof ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    });
  }
}
