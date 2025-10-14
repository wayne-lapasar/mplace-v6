# Rate Limiting

Production-ready rate limiting system using Bun's built-in Redis client with sliding window algorithm for the Lapasar B2B eCommerce Platform.

## Overview

The rate limiting system provides:
- ✅ Request throttling per user/IP
- ✅ Sliding window algorithm for accurate rate limiting
- ✅ Bun's native Redis client for high performance
- ✅ Standard rate limit headers (X-RateLimit-*)
- ✅ 429 Too Many Requests responses
- ✅ Security event logging
- ✅ Configurable limits per environment
- ✅ Skip internal service requests

## Architecture

```
┌──────────────────────────────────────────┐
│         Rate Limit Middleware             │
│  • Extract identifier (user ID or IP)    │
│  • Check rate limit                       │
│  • Set headers (Limit, Remaining, Reset)  │
│  • Return 429 if exceeded                 │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│      RateLimiterService                   │
│  • Sliding window counter                │
│  • Increment requests                     │
│  • Calculate remaining/reset time         │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│         BunRedisCache                     │
│  • Bun's native Redis client              │
│  • Key-value storage with TTL             │
│  • Increment operations                   │
└──────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```env
# * Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# * Time window in milliseconds (default: 60000 = 1 minute)
RATE_LIMIT_WINDOW_MS=60000

# * Maximum requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100

# * Skip successful requests (default: false)
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# * Redis connection (required for rate limiting)
REDIS_URL=redis://localhost:6379
```

### Recommended Limits

| Environment | Window | Max Requests | Purpose |
|-------------|--------|--------------|---------|
| Development | 60s    | 1000         | No throttling for dev |
| Staging     | 60s    | 100          | Moderate limits |
| Production  | 60s    | 60           | Strict for public API |

## How It Works

### 1. Sliding Window Algorithm

```typescript
// * Example: 100 requests per minute
const windowMs = 60000; // 1 minute
const maxRequests = 100;

// * Each request increments counter with TTL
await cache.set('ratelimit:user:123', currentCount + 1, windowMs / 1000);

// * Counter automatically expires after window
// * Next window starts fresh
```

**Benefits:**
- Accurate rate limiting
- No reset spike (smooth distribution)
- Automatic cleanup via TTL

### 2. Identifier Generation

The middleware uses different identifiers based on authentication:

```typescript
// * Authenticated users: rate limit per user
user:abc123

// * Unauthenticated requests: rate limit per IP
ip:192.168.1.1

// * Microservice requests: skip rate limiting
source: microservice
```

### 3. Response Headers

Standard rate limit headers are included in every response:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-14T10:30:00Z
```

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-10-14T10:30:00Z
Retry-After: 60
```

## Usage

### Global Rate Limiting

Applied to all endpoints by default:

```typescript
// * In app.ts - automatically applied
app.use(
  '*',
  rateLimitMiddleware(container.rateLimiter, container.logger, {
    keyGenerator: createUserKeyGenerator(),
    skip: skipInternalServices(),
  })
);
```

### Custom Rate Limiting for Specific Routes

```typescript
// * Stricter limit for authentication endpoints
const authRateLimiter = new RateLimiterService(cache, {
  windowMs: 60000, // 1 minute
  maxRequests: 5,   // Only 5 login attempts per minute
  keyPrefix: 'auth',
});

app.post(
  '/auth/login',
  rateLimitMiddleware(authRateLimiter, logger, {
    keyGenerator: (c) => {
      // * Rate limit by email for login attempts
      const { email } = c.req.json();
      return `email:${email}`;
    },
  }),
  loginHandler
);
```

### Skip Rate Limiting

```typescript
// * Skip for internal microservice requests
rateLimitMiddleware(rateLimiter, logger, {
  skip: (c) => {
    const source = c.req.header('x-client-source');
    return source === 'microservice';
  },
});

// * Skip for health check endpoints
rateLimitMiddleware(rateLimiter, logger, {
  skip: (c) => c.req.path === '/health',
});
```

### Custom On Limit Reached Handler

```typescript
rateLimitMiddleware(rateLimiter, logger, {
  onLimitReached: async (c) => {
    // * Send email notification
    await sendAlert(`Rate limit exceeded for ${c.req.header('x-forwarded-for')}`);
  },
});
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-14T10:30:00Z
```

### Rate Limit Exceeded

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

**Headers:**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-10-14T10:30:00Z
Retry-After: 60
```

## Security Logging

All rate limit violations are logged as security events:

```typescript
{
  type: 'security',
  level: 'warn',
  event: 'rate_limit_exceeded',
  severity: 'medium',
  actor: {
    identifier: 'user:123' | 'ip:192.168.1.1',
  },
  details: {
    path: '/api/users',
    limit: 100,
    identifier: 'user:123',
  },
  timestamp: '2025-10-14T10:30:00Z',
  correlationId: 'req_01JCXYZ123',
}
```

Query violations in MongoDB:

```javascript
// * Find all rate limit violations
db.logs.find({ event: 'rate_limit_exceeded' });

// * Find violations by user
db.logs.find({
  event: 'rate_limit_exceeded',
  'details.identifier': /^user:123/,
});

// * Count violations per IP
db.logs.aggregate([
  { $match: { event: 'rate_limit_exceeded' } },
  { $group: { _id: '$details.identifier', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);
```

## Best Practices

### DO ✅

1. **Use Redis in production** - In-memory cache is for development only
2. **Different limits for different endpoints** - Auth should be stricter
3. **Rate limit by user ID when authenticated** - More accurate than IP
4. **Log rate limit violations** - Monitor for attacks
5. **Set appropriate retry-after** - Help clients retry correctly
6. **Skip internal services** - Don't throttle microservice communication

### DON'T ❌

1. **Don't use in-memory cache in production** - Not shared across instances
2. **Don't set limits too low** - Can break legitimate usage
3. **Don't ignore rate limit headers** - Clients need this information
4. **Don't skip rate limiting for all authenticated users** - Still vulnerable to abuse
5. **Don't forget to monitor** - Track violation patterns

## Troubleshooting

### Rate Limiting Not Working

**Check:**
1. `RATE_LIMIT_ENABLED=true` in environment
2. Redis connection is active (`REDIS_URL` correct)
3. Cache is properly initialized in DI container
4. Middleware is applied before routes

### Too Many False Positives

**Solutions:**
1. Increase `RATE_LIMIT_MAX_REQUESTS`
2. Increase `RATE_LIMIT_WINDOW_MS`
3. Use per-user rate limiting instead of per-IP
4. Skip authenticated users for certain endpoints

### Redis Connection Issues

**Check:**
1. Redis server is running (`redis-cli ping`)
2. `REDIS_URL` is correct
3. Network connectivity to Redis
4. Redis authentication if required

## Testing

### Manual Testing

```bash
# * Test rate limiting
for i in {1..110}; do
  curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users
done

# * Check headers
curl -I http://localhost:3000/api/users
```

### Integration Tests

```typescript
describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    for (let i = 0; i < 100; i++) {
      const res = await app.request('/api/users');
      expect(res.status).toBe(200);
    }
  });

  it('should block requests exceeding limit', async () => {
    // * Make 100 requests (at limit)
    for (let i = 0; i < 100; i++) {
      await app.request('/api/users');
    }

    // * 101st request should be rate limited
    const res = await app.request('/api/users');
    expect(res.status).toBe(429);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('should reset after window expires', async () => {
    // * Make 100 requests
    for (let i = 0; i < 100; i++) {
      await app.request('/api/users');
    }

    // * Wait for window to reset
    await sleep(60000);

    // * Should allow requests again
    const res = await app.request('/api/users');
    expect(res.status).toBe(200);
  });
});
```

## Migration to Redis (Production)

When moving to production, switch from InMemoryCache to BunRedisCache:

```typescript
// * In DI container
// Before (development):
this.cache = new InMemoryCache();

// After (production):
this.cache = new BunRedisCache(env.REDIS_URL || 'redis://localhost:6379');
```

**Benefits of Redis:**
- ✅ Shared across multiple server instances
- ✅ Persists across server restarts
- ✅ Better performance at scale
- ✅ Built-in TTL/expiration

## Advanced Patterns

### Dynamic Rate Limits

```typescript
// * Different limits based on user plan
const getRateLimit = (user: User) => {
  switch (user.plan) {
    case 'premium':
      return { windowMs: 60000, maxRequests: 1000 };
    case 'standard':
      return { windowMs: 60000, maxRequests: 100 };
    default:
      return { windowMs: 60000, maxRequests: 10 };
  }
};
```

### Bypass for Admin Users

```typescript
rateLimitMiddleware(rateLimiter, logger, {
  skip: (c) => {
    const user = c.get('user');
    return user?.role === 'admin';
  },
});
```

### Rate Limit by Endpoint Group

```typescript
// * Separate limits for read vs write operations
app.get('/api/*', rateLimitMiddleware(readRateLimiter, logger));
app.post('/api/*', rateLimitMiddleware(writeRateLimiter, logger));
```

---

**Built with Bun's native Redis client for maximum performance** ⚡
