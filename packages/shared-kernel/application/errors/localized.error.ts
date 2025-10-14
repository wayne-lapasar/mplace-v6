// * Base error with localization support

import { ContentfulStatusCode } from 'hono/utils/http-status';

import { ApplicationError } from './application.error';

export class LocalizedError extends ApplicationError {
  constructor(
    message: string,
    code: string,
    statusCode: ContentfulStatusCode,
    public readonly translationKey: string,
    public readonly translationParams?: Record<string, string | number>
  ) {
    super(message, code, statusCode);
    this.name = 'LocalizedError';
  }
}
