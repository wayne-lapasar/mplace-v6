// * Forbidden error

import { ApplicationError } from './application.error';

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}
