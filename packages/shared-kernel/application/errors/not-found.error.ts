// * Not found error

import { ApplicationError } from './application.error';

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID "${id}" not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
