// * Main router that aggregates all service routes

import { Hono } from 'hono';

import type { DIContainer } from '../../config/di-container';
import { createUsersAPI } from '../../services/users/api';
import { createHealthRoutes } from './health.routes';

export function createRouter(container: DIContainer) {
  const app = new Hono();

  // * Mount health routes
  app.route('/', createHealthRoutes(container));

  // * Mount service routes
  app.route('/api/v1/users', createUsersAPI(container));

  return app;
}
