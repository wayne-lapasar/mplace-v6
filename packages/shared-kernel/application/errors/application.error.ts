import { ContentfulStatusCode } from 'hono/utils/http-status';

// * Base application error
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: ContentfulStatusCode = 500
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
