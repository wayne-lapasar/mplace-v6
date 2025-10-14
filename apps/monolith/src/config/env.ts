// * Environment variables validation

import { z } from 'zod';

const EnvSchema = z.object({
  // * Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // * Database
  MONGODB_URI: z.string().url(),
  MONGODB_DB_NAME: z.string().default('lapasar-corp'),

  // * Cache
  REDIS_URL: z.string().url().optional(),

  // * JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // * Argon2
  ARGON2_MEMORY_SIZE: z.coerce.number().default(19456),
  ARGON2_ITERATIONS: z.coerce.number().default(2),
  ARGON2_PARALLELISM: z.coerce.number().default(1),

  // * Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_TO_FILE: z.coerce.boolean().default(false),
  LOG_TO_DB: z.coerce.boolean().default(false),
  LOG_FILE_PATH: z.string().default('/var/log/lapasar/app.log'),
  LOG_FILE_MAX_SIZE: z.string().default('100MB'),
  LOG_FILE_MAX_FILES: z.coerce.number().default(30),

  // * Internationalization
  DEFAULT_LOCALE: z.enum(['en', 'ms']).default('en'),

  // * Rate Limiting
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000), // * 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100), // * 100 requests per minute
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
}
