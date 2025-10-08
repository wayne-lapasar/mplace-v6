import type { Hono } from 'hono'

import type { AppContainer } from '../../bootstrap/container'
import { registerHealthRoutes } from './health'

export function registerRoutes(app: Hono, container: AppContainer) {
  registerHealthRoutes(app, container)
}
