export interface HttpConfig {
  host: string
  port: number
  corsOrigins: string[]
}

export interface MongoConfig {
  uri: string
  database: string
  options?: Record<string, unknown>
}

export interface RedisConfig {
  uri: string
  prefix?: string
}

export interface QueueConfig {
  uri: string
  driver: 'redis' | 'rabbitmq' | 'kafka' | 'in-memory'
  options?: Record<string, unknown>
}

export interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  callbackUrl: string
}

export interface SecurityConfig {
  jwtSecret: string
  jwtExpiresIn: string
  refreshTokenExpiresIn: string
  apiKeyLength: number
  rateLimiter: {
    points: number
    duration: number
  }
}

export interface RuntimeConfig {
  env: 'development' | 'test' | 'staging' | 'production'
  serviceName: string
  http: HttpConfig
  mongo: MongoConfig
  redis: RedisConfig
  queue: QueueConfig
  security: SecurityConfig
  telemetry: {
    enabled: boolean
    serviceName: string
  }
}
