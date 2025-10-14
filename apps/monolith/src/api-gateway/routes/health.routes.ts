// * Health check routes

import { Hono } from 'hono';

import type { DIContainer } from '../../config/di-container';

export function createHealthRoutes(container: DIContainer) {
  const app = new Hono();

  // * Basic health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // * Detailed health check
  app.get('/health/ready', async (c) => {
    const result = await container.healthCheckService.check();
    const statusCode = result.status === 'healthy' ? 200 : 503;
    return c.json(result, statusCode);
  });

  return app;
}
