// * Request/response logging middleware

import { Context } from 'hono';
import { ulid } from 'ulid';

import type { RequestSource, SmartLogger } from '@lapasar/infrastructure';

// * Helper to extract and validate request source from header
function extractRequestSource(c: Context): RequestSource {
  const sourceHeader = c.req.header('x-client-source') || c.req.header('x-request-source');

  if (!sourceHeader) {
    return 'unknown';
  }

  const validSources: RequestSource[] = ['web', 'mobile', 'microservice', 'cli', 'cron', 'webhook'];
  const normalizedSource = sourceHeader.toLowerCase() as RequestSource;

  return validSources.includes(normalizedSource) ? normalizedSource : 'unknown';
}

export function loggingMiddleware(logger: SmartLogger) {
  return async (c: Context, next: () => Promise<void>) => {
    const start = Date.now();
    const correlationId = ulid(); // * ULID for sortable request tracking

    // * Store correlation ID in context for use in other middleware
    c.set('correlationId', correlationId);

    await next();

    const duration = Date.now() - start;
    const statusCode = c.res.status;

    // * Extract request source from header
    const source = extractRequestSource(c);

    // * Log request with SmartLogger
    await logger.logRequest({
      source,
      performance: {
        databaseQueries: c.get('dbQueries') || 0,
        databaseTime: c.get('dbTime') || 0,
        cacheHits: c.get('cacheHits') || 0,
        cacheMisses: c.get('cacheMisses') || 0,
      },
      request: {
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        method: c.req.method,
        path: c.req.path,
        query: c.req.query() as Record<string, unknown>,
        userAgent: c.req.header('user-agent'),
      },
      response: {
        duration,
        size: parseInt(c.res.headers.get('content-length') || '0', 10),
        statusCode,
      },
      user: c.get('user')
        ? {
            email: c.get('user').email,
            id: c.get('user').id,
          }
        : undefined,
    });
  };
}
