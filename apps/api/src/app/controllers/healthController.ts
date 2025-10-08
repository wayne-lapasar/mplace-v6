import type { Context } from 'hono'

import type { AppContainer } from '../../bootstrap/container'

export async function healthController(
  container: AppContainer,
  context: Context
): Promise<Response> {
  container.logger.debug('Health check accessed')

  return context.json({
    status: 'ok',
    service: container.config.serviceName,
    timestamp: new Date().toISOString(),
  })
}

export async function readinessController(
  container: AppContainer,
  context: Context
): Promise<Response> {
  container.logger.debug('Readiness check accessed')

  return context.json({
    status: 'ready',
    dependencies: {
      mongo: 'unknown',
      cache: 'unknown',
      queue: 'unknown',
    },
    timestamp: new Date().toISOString(),
  })
}
