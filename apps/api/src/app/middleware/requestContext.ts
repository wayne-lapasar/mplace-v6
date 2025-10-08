import type { MiddlewareHandler } from 'hono'

import type { AppContainer } from '../../bootstrap/container'

export function requestContext(container: AppContainer): MiddlewareHandler {
  return async (context, next) => {
    const requestId = crypto.randomUUID()

    context.set('requestId', requestId)
    context.set('startedAt', Date.now())

    container.logger.debug('Incoming request', {
      method: context.req.method,
      path: context.req.path,
      requestId,
    })

    await next()
  }
}
