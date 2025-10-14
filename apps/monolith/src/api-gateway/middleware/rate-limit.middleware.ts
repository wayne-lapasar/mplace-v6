// * Rate limiting middleware

import type { Context } from 'hono';

import type { RateLimiterService, SmartLogger } from '@lapasar/infrastructure';

export interface RateLimitOptions {
  keyGenerator?: (c: Context) => string;
  skip?: (c: Context) => boolean;
  onLimitReached?: (c: Context) => Promise<void>;
}

export function rateLimitMiddleware(
  rateLimiter: RateLimiterService,
  logger: SmartLogger,
  options: RateLimitOptions = {}
) {
  return async (c: Context, next: () => Promise<void>) => {
    // * Allow skipping rate limiting for certain requests
    if (options.skip && options.skip(c)) {
      return await next();
    }

    // * Generate key (default: IP address)
    const identifier = options.keyGenerator
      ? options.keyGenerator(c)
      : c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    // * Check rate limit
    const result = await rateLimiter.checkLimit(identifier);

    // * Set rate limit headers
    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', result.resetTime.toISOString());

    if (!result.allowed) {
      // * Log rate limit violation
      await logger.logSecurity({
        details: {
          identifier,
          limit: result.limit,
          path: c.req.path,
        },
        event: 'rate_limit_exceeded',
        severity: 'medium',
      });

      // * Custom handler if provided
      if (options.onLimitReached) {
        await options.onLimitReached(c);
      }

      // * Set Retry-After header
      if (result.retryAfter) {
        c.header('Retry-After', result.retryAfter.toString());
      }

      // * Return 429 Too Many Requests
      return c.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter,
          },
          success: false,
        },
        429
      );
    }

    // * Continue to next middleware
    await next();
  };
}

// * Helper to create key generator for authenticated users
export function createUserKeyGenerator() {
  return (c: Context): string => {
    const user = c.get('user');
    return user ? `user:${user.id}` : `ip:${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'}`;
  };
}

// * Helper to skip rate limiting for internal services
export function skipInternalServices() {
  return (c: Context): boolean => {
    const source = c.req.header('x-client-source');
    return source === 'microservice';
  };
}