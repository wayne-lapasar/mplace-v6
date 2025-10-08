import type { Hono } from 'hono'

import type { AppContainer } from '../../bootstrap/container'
import { healthController, readinessController } from '../controllers/healthController'

export function registerHealthRoutes(app: Hono, container: AppContainer) {
  app.get('/health', context => healthController(container, context))
  app.get('/readiness', context => readinessController(container, context))
}
