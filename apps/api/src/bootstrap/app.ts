import { Hono } from 'hono'

import { errorHandler, requestContext, requestLogger } from '@api/app/middleware'
import { registerRoutes } from '../app/routes'
import type { AppContainer } from './container'

export async function createApp(container: AppContainer) {
  const app = new Hono()

  app.use('*', requestContext(container))
  app.use('*', requestLogger(container))
  app.onError(errorHandler(container))

  registerRoutes(app, container)

  return app
}
