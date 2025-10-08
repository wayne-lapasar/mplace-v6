import type { MiddlewareHandler } from 'hono'

import type { AppContainer } from '../../bootstrap/container'

export function requestLogger(container: AppContainer): MiddlewareHandler {
  return async (context, next) => {
    const startedAt = Date.now()

    try {
      await next()
    } finally {
      const duration = Date.now() - startedAt
      const requestId = context.get('requestId') as string | undefined

      container.logger.info('Request completed', {
        method: context.req.method,
        path: context.req.path,
        status: context.res.status,
        duration,
        requestId,
      })
    }
  }
}
