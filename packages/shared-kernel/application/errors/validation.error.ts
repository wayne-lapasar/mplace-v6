// * Validation error wrapper

import { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

import { ApplicationError } from './application.error';

export class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', 400 as ContentfulStatusCode);
    this.name = 'ValidationError';
  }

  static fromZodError(error: ZodError): ValidationError {
    const errors = error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return new ValidationError('Validation failed', errors);
  }
}
