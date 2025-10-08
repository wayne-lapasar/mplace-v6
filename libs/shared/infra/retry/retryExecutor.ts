import type { Logger } from '@shared/interfaces/logger'

export interface RetryOptions {
  retries: number
  baseDelayMs: number
  maxDelayMs?: number
  factor?: number
  jitter?: boolean
}

const defaultOptions: RetryOptions = {
  retries: 3,
  baseDelayMs: 200,
  maxDelayMs: 5_000,
  factor: 2,
  jitter: true,
}

export async function retryWithBackoff<T>(
  task: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  logger?: Logger
): Promise<T> {
  const mergedOptions = { ...defaultOptions, ...options }
  let attempt = 0
  let lastError: unknown

  while (attempt <= mergedOptions.retries) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      logger?.warn('Retryable operation failed', {
        attempt,
        retries: mergedOptions.retries,
        error,
      })

      if (attempt === mergedOptions.retries) {
        break
      }

      const delay = computeDelay(mergedOptions.baseDelayMs, attempt, mergedOptions)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    attempt += 1
  }

  throw lastError
}

function computeDelay(baseDelay: number, attempt: number, options: RetryOptions) {
  const exponential = baseDelay * Math.pow(options.factor ?? 2, attempt)
  const limited = Math.min(exponential, options.maxDelayMs ?? exponential)
  const jitter = options.jitter ? Math.random() * baseDelay : 0

  return limited + jitter
}
