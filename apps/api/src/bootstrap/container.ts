import { createLogger } from '@shared/infra/logging/logger'
import type { Logger } from '@shared/interfaces/logger'
import type { RuntimeConfig } from '@shared/interfaces/config'
import { loadApiConfig } from '../config/appConfig'

export interface AppContainer {
  logger: Logger
  config: RuntimeConfig
}

let cachedContainer: AppContainer | undefined

export async function buildContainer(): Promise<AppContainer> {
  if (cachedContainer) {
    return cachedContainer
  }

  const config = await loadApiConfig()
  const logger = createLogger(config)

  cachedContainer = {
    logger,
    config,
  }

  return cachedContainer
}
