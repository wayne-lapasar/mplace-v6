import { z } from 'zod'
import type { RuntimeConfig } from '@shared/interfaces/config'

const environmentSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('lapasar-api'),
  APP_HOST: z.string().default('0.0.0.0'),
  APP_PORT: z.coerce.number().default(3000),
  APP_CORS_ORIGINS: z.string().default('*'),
  MONGO_URI: z.string().default('mongodb://localhost:27017'),
  MONGO_DB: z.string().default('lapasar'),
  REDIS_URI: z.string().default('redis://localhost:6379'),
  REDIS_PREFIX: z.string().default('lapasar'),
  QUEUE_URI: z.string().default('redis://localhost:6379'),
  QUEUE_DRIVER: z.enum(['redis', 'rabbitmq', 'kafka', 'in-memory']).default('in-memory'),
  JWT_SECRET: z.string().default('change-me'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  API_KEY_LENGTH: z.coerce.number().default(32),
  RATE_LIMIT_POINTS: z.coerce.number().default(100),
  RATE_LIMIT_DURATION: z.coerce.number().default(60),
  TELEMETRY_ENABLED: z.coerce.boolean().default(false),
  TELEMETRY_SERVICE_NAME: z.string().optional(),
})

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const source = typeof Bun !== 'undefined' ? Bun.env : process.env
  const parsed = environmentSchema.parse(source)
  const corsOrigins =
    parsed.APP_CORS_ORIGINS === '*'
      ? ['*']
      : parsed.APP_CORS_ORIGINS.split(',').map(origin => origin.trim())

  return {
    env: parsed.APP_ENV,
    serviceName: parsed.APP_NAME,
    http: {
      host: parsed.APP_HOST,
      port: parsed.APP_PORT,
      corsOrigins,
    },
    mongo: {
      uri: parsed.MONGO_URI,
      database: parsed.MONGO_DB,
    },
    redis: {
      uri: parsed.REDIS_URI,
      prefix: parsed.REDIS_PREFIX,
    },
    queue: {
      uri: parsed.QUEUE_URI,
      driver: parsed.QUEUE_DRIVER,
    },
    security: {
      jwtSecret: parsed.JWT_SECRET,
      jwtExpiresIn: parsed.JWT_EXPIRES_IN,
      refreshTokenExpiresIn: parsed.REFRESH_TOKEN_EXPIRES_IN,
      apiKeyLength: parsed.API_KEY_LENGTH,
      rateLimiter: {
        points: parsed.RATE_LIMIT_POINTS,
        duration: parsed.RATE_LIMIT_DURATION,
      },
    },
    telemetry: {
      enabled: parsed.TELEMETRY_ENABLED,
      serviceName: parsed.TELEMETRY_SERVICE_NAME ?? parsed.APP_NAME,
    },
  }
}
