# Smart Logging System Design

Production-ready logging system with multi-transport support, structured logging, and performance tracking for the Lapasar B2B eCommerce Platform.

## Overview

The smart logging system provides:

- ✅ Multi-transport logging (Console, File, MongoDB)
- ✅ Structured log entries with correlation IDs
- ✅ Performance tracking and slow operation detection
- ✅ Automatic log rotation and TTL
- ✅ Request/response logging
- ✅ Error tracking with context
- ✅ Type-safe log entries

## Architecture

```
┌──────────────────────────────────────────────────┐
│             SmartLogger Service                   │
│  ┌────────────────────────────────────────────┐  │
│  │  Log Entry Types:                          │  │
│  │  • Request Logs (HTTP lifecycle)           │  │
│  │  • Error Logs (Structured errors)          │  │
│  │  • Performance Logs (Slow operations)      │  │
│  │  • Security Logs (Auth events)             │  │
│  └────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌──────────┐
│Console  │  │  File   │  │ MongoDB  │
│Transport│  │Transport│  │Transport │
│(dev/prod│  │(rotation)  │(errors)  │
└─────────┘  └─────────┘  └──────────┘
```

## Log Types

### 1. Request Logs

Tracks HTTP request lifecycle with performance metrics.

```typescript
{
  type: 'request',
  level: 'info',
  timestamp: '2025-01-15T10:30:00Z',
  correlationId: 'req_01JCXYZ123',
  service: 'lapasar-api',
  environment: 'production',
  request: {
    method: 'POST',
    path: '/api/v1/users/register',
    query: { lang: 'ms' },
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  },
  response: {
    statusCode: 201,
    duration: 145,  // * milliseconds
    size: 1024      // * bytes
  },
  user: {
    id: 'usr_123',
    email: 'user@example.com'
  },
  performance: {
    databaseQueries: 3,
    databaseTime: 45,
    cacheHits: 2,
    cacheMisses: 1
  }
}
```

### 2. Error Logs

Structured error tracking with full context.

```typescript
{
  type: 'error',
  level: 'error',
  timestamp: '2025-01-15T10:30:00Z',
  correlationId: 'req_01JCXYZ123',
  error: {
    name: 'UserNotFoundError',
    message: 'User with ID 123 not found',
    code: 'USER_NOT_FOUND',
    statusCode: 404,
    stack: '...',
    translationKey: 'users.errors.userNotFound'
  },
  context: {
    userId: '123',
    locale: 'en'
  },
  request: {
    method: 'GET',
    path: '/api/v1/users/123'
  },
  user: {
    id: 'usr_456',
    email: 'requester@example.com'
  }
}
```

### 3. Performance Logs

Automatic slow operation detection.

```typescript
{
  type: 'performance',
  level: 'warn',  // * 'warn' if threshold exceeded
  timestamp: '2025-01-15T10:30:00Z',
  correlationId: 'req_01JCXYZ123',
  operation: {
    name: 'UserRepository.findById',
    type: 'database',
    duration: 250,  // * milliseconds
    threshold: 100  // * ms - exceeded!
  },
  metadata: {
    query: 'db.users.findOne({ _id: ... })'
  },
  alert: {
    level: 'warning',
    reason: 'Operation exceeded threshold of 100ms',
    recommendations: [
      'Consider optimizing this operation',
      'Add caching if applicable'
    ]
  }
}
```

### 4. Security Logs

Track authentication and security events.

```typescript
{
  type: 'security',
  level: 'warn',
  timestamp: '2025-01-15T10:30:00Z',
  event: 'failed_login_attempt',
  severity: 'medium',
  actor: {
    email: 'user@example.com',
    ip: '123.45.67.89'
  },
  details: {
    attemptCount: 3,
    reason: 'invalid_password'
  },
  threat: {
    score: 60,
    indicators: ['multiple_failed_attempts'],
    action: 'rate_limited'
  }
}
```

## Transports

### Console Transport

**Purpose:** Real-time logging during development and production
**Output:** Pretty-printed (dev) or JSON (prod)
**Level:** Configurable via `LOG_LEVEL`

**Features:**

- Colored output in development
- Structured JSON in production
- Immediate feedback

### File Transport

**Purpose:** Long-term log storage with rotation
**Output:** JSON lines in daily files
**Level:** Configurable via `LOG_LEVEL`

**Features:**

- Automatic file rotation by size
- Daily log files (e.g., `app-2025-01-15.log`)
- Configurable max size and file count
- Compression support

**Configuration:**

```env
LOG_TO_FILE=true
LOG_FILE_PATH=/var/log/lapasar/app.log
LOG_FILE_MAX_SIZE=100MB
LOG_FILE_MAX_FILES=30
```

### MongoDB Transport

**Purpose:** Searchable error log storage
**Output:** MongoDB collection
**Level:** `warn` and above (errors only)

**Features:**

- Indexed for fast queries
- Automatic TTL (30 days default)
- Correlation ID tracking
- Type-based filtering

**Indexes:**

- `timestamp` (descending) - Time-based queries
- `correlationId` - Request tracking
- `type` - Filter by log type
- `level` - Filter by severity
- TTL index - Automatic expiration

## Usage

### Basic Logging

```typescript
// * In use cases, repositories, services
await this.logger.info('User registered', { userId: 'usr_123' });
await this.logger.error('Failed to save user', { error: err });
await this.logger.warn('Slow query detected', { duration: 250 });
await this.logger.debug('Processing request', { step: 1 });
```

### Request Logging

Automatic via middleware - no manual logging needed:

```typescript
// * Middleware automatically logs:
// * - Incoming request
// * - Response (status, duration, size)
// * - User info (if authenticated)
// * - Performance metrics
```

### Error Logging

Automatic via error middleware:

```typescript
// * Just throw errors - middleware handles logging:
throw new UserNotFoundError(userId);

// * Logs include:
// * - Full error details
// * - Stack trace
// * - Request context
// * - User info
// * - Correlation ID
```

### Performance Tracking

Use the `@TrackPerformance` decorator:

```typescript
class UserRepository {
  @TrackPerformance({ threshold: 100, type: 'database' })
  async findById(id: string) {
    // * Automatically logs if > 100ms
    return await this.collection.findOne({ _id: id });
  }
}
```

### Custom Log Entries

```typescript
// * Log security events
await logger.logSecurity({
  event: 'suspicious_activity',
  severity: 'high',
  actor: { ip: '1.2.3.4' },
  details: { reason: 'rapid_requests' },
});

// * Log performance manually
await logger.logPerformance({
  operation: {
    name: 'batch_import',
    type: 'computation',
    duration: 5000,
    threshold: 3000,
  },
  metadata: { records: 10000 },
});
```

## Configuration

### Environment Variables

```env
# * Logging Level
LOG_LEVEL=info              # debug|info|warn|error

# * File Transport
LOG_TO_FILE=false           # Enable file logging
LOG_FILE_PATH=/var/log/lapasar/app.log
LOG_FILE_MAX_SIZE=100MB     # Rotate at this size
LOG_FILE_MAX_FILES=30       # Keep last 30 files

# * MongoDB Transport
LOG_TO_DB=false             # Enable database logging
```

### Transport Selection

| Environment | Console   | File | MongoDB |
| ----------- | --------- | ---- | ------- |
| Development | ✅ Pretty | ❌   | ❌      |
| Staging     | ✅ JSON   | ✅   | ✅      |
| Production  | ✅ JSON   | ✅   | ✅      |

## Best Practices

### DO ✅

1. **Use correlation IDs** - Track requests end-to-end
2. **Log at appropriate levels:**
   - `debug` - Detailed diagnostic info
   - `info` - General information (requests, actions)
   - `warn` - Warning conditions (slow queries, deprecations)
   - `error` - Error conditions (exceptions, failures)
3. **Include context** - Add relevant data to logs
4. **Use structured logging** - Always log objects, not strings
5. **Track performance** - Use decorators for automatic tracking

### DON'T ❌

1. **Don't log sensitive data** - Passwords, tokens, credit cards
2. **Don't log in loops** - Causes log flooding
3. **Don't use console.log** - Always use the logger
4. **Don't log without context** - Include correlation IDs
5. **Don't ignore errors** - Always log caught exceptions

## Performance Considerations

### Log Sampling (Phase 2)

To reduce costs in high-traffic scenarios:

```typescript
// * Sample logs based on level
{
  debug: 0.01,  // * Log 1% of debug logs
  info: 0.1,    // * Log 10% of info logs
  warn: 0.5,    // * Log 50% of warnings
  error: 1.0    // * Log 100% of errors
}
```

### Async Logging

All transports use `Promise.all()` for parallel writes:

- Doesn't block request processing
- Failures in one transport don't affect others
- Fast response times

## Querying Logs

### MongoDB Queries

```typescript
// * Find all errors for a request
db.logs.find({ correlationId: 'req_01JCXYZ' });

// * Find slow database queries
db.logs.find({
  type: 'performance',
  'operation.type': 'database',
  'operation.duration': { $gt: 1000 },
});

// * Find failed login attempts
db.logs.find({
  type: 'security',
  event: 'failed_login_attempt',
});

// * Aggregation example: Error counts by type
db.logs.aggregate([
  { $match: { type: 'error' } },
  { $group: { _id: '$error.code', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);
```

### File Queries

```bash
# * Search for errors
grep '"level":"error"' /var/log/lapasar/app-2025-01-15.log

# * Find slow queries
jq 'select(.type=="performance" and .operation.duration > 1000)' \
  /var/log/lapasar/app-2025-01-15.log

# * Track a specific request
grep 'req_01JCXYZ' /var/log/lapasar/app-2025-01-15.log | jq .
```

## Phase 2 Enhancements (Future)

1. **Redis Streams Transport** - Real-time log streaming
2. **Log Sampling** - Reduce volume in production
3. **Log Query Service** - Search API for logs
4. **Alerting System** - Real-time alerts via Slack/Email
5. **Log Aggregation** - Group similar errors
6. **Metrics Dashboard** - Visualize log data

## Troubleshooting

### No logs appearing

1. Check `LOG_LEVEL` is not too restrictive
2. Verify transport is enabled
3. Check file permissions for file transport
4. Verify MongoDB connection for DB transport

### File transport not rotating

1. Check `LOG_FILE_MAX_SIZE` format (e.g., `100MB`)
2. Ensure write permissions to log directory
3. Check disk space

### MongoDB transport failing

1. Verify MongoDB connection
2. Check collection permissions
3. Review indexes creation logs

## File Structure

```
packages/infrastructure/logging/
├── decorators/
│   ├── index.ts
│   └── track-performance.ts       # * Performance decorator
├── transports/
│   ├── console.transport.ts       # * Console output
│   ├── file.transport.ts          # * File with rotation
│   ├── index.ts
│   └── mongodb.transport.ts       # * MongoDB storage
├── index.ts                       # * Exports
├── log-context.ts                 # * Request context
├── logger.ts                      # * Legacy Pino adapter
├── smart-logger.service.ts        # * Main service
├── transport.port.ts              # * Transport interface
└── types.ts                       # * Type definitions
```

## Migration from Old Logger

The old `PinoLoggerAdapter` is replaced by `SmartLogger`:

**Before:**

```typescript
logger.info('Message', { key: 'value' });
```

**After:**

```typescript
// * Still works the same way!
await logger.info('Message', { key: 'value' });

// * Plus new specialized methods:
await logger.logRequest({ request, response });
await logger.logError(error, context);
await logger.logPerformance({ operation });
```

## Contributing

When adding new log types:

1. Define type in `types.ts`
2. Add method to `SmartLogger`
3. Update documentation
4. Add examples

---

**Built with best practices for production observability** 🔍
