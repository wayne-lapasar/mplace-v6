import type { Context } from 'hono'

import type { AppContainer } from '../../bootstrap/container'

export function errorHandler(container: AppContainer) {
  return (error: Error, context: Context) => {
    const requestId = context.get('requestId') as string | undefined

    container.logger.error('Unhandled error', {
      message: error.message,
      stack: error.stack,
      requestId,
    })

    return context.json(
      {
        error: 'Internal Server Error',
        requestId,
      },
      500
    )
  }
}
