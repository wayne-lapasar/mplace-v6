import type { RuntimeConfig } from '@shared/interfaces/config'
import { loadRuntimeConfig } from '@shared/infra/config/environment'

export async function loadApiConfig(): Promise<RuntimeConfig> {
  const config = await loadRuntimeConfig()

  return {
    ...config,
    serviceName: config.serviceName ?? 'lapasar-api',
    http: {
      host: config.http.host,
      port: config.http.port,
      corsOrigins: config.http.corsOrigins,
    },
  }
}
