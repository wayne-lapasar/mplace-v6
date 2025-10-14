// * Creates and configures Hono app with all middleware

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { DIContainer } from '../config/di-container';
import { errorHandler } from './middleware/error.middleware';
import { i18nMiddleware } from './middleware/i18n.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { createUserKeyGenerator, rateLimitMiddleware, skipInternalServices } from './middleware/rate-limit.middleware';
import { createRouter } from './routes/index';

export function createApp(container: DIContainer) {
  const app = new Hono();

  // * Global middleware
  app.use('*', cors());
  app.use('*', i18nMiddleware(container.i18nService));
  app.use(
    '*',
    rateLimitMiddleware(container.rateLimiter, container.logger, {
      keyGenerator: createUserKeyGenerator(),
      skip: skipInternalServices(),
    })
  );
  app.use('*', loggingMiddleware(container.logger));

  // * Mount routes
  app.route('/', createRouter(container));

  // ! Error handling (must be last)
  app.onError(errorHandler(container.logger, container.i18nService));

  return app;
}
