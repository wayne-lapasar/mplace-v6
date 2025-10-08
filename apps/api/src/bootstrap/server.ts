import type { Server } from 'bun'

import { createApp } from './app'
import { buildContainer } from './container'

let serverInstance: Server | undefined

export async function startServer() {
  if (serverInstance) {
    return serverInstance
  }

  const container = await buildContainer()
  const app = await createApp(container)
  const { http } = container.config

  serverInstance = Bun.serve({
    port: http.port,
    hostname: http.host,
    fetch: app.fetch,
    error(error) {
      container.logger.error('Unhandled server error', { error })
      return new Response('Internal Server Error', { status: 500 })
    },
  })

  container.logger.info('API server started', {
    port: http.port,
    host: http.host,
  })

  return serverInstance
}

export async function stopServer() {
  if (!serverInstance) {
    return
  }

  serverInstance.stop()
  serverInstance = undefined
}
