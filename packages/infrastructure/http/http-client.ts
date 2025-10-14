// * HTTP client with retry mechanism

import { setTimeout as wait } from 'node:timers/promises';
import { fetch, type RequestInit, type Response } from 'undici';

import type { Logger } from '../logging/logger';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  dampingFactor: number; // * Exponential backoff multiplier
}

export class HTTPClient {
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    dampingFactor: 2,
  };

  constructor(
    private readonly logger: Logger,
    private readonly retryConfig?: Partial<RetryConfig>
  ) {
    this.defaultRetryConfig = { ...this.defaultRetryConfig, ...this.retryConfig };
  }

  async fetch(
    url: string,
    options?: RequestInit,
    retryConfig?: Partial<RetryConfig>
  ): Promise<Response> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // * Retry on server errors (5xx)
        if (response.status >= 500 && attempt < config.maxRetries) {
          throw new Error(`Server error: ${response.status}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        if (attempt < config.maxRetries) {
          const delay = config.initialDelayMs * Math.pow(config.dampingFactor, attempt);

          this.logger.warn('HTTP request failed, retrying', {
            url,
            attempt: attempt + 1,
            maxRetries: config.maxRetries,
            delayMs: delay,
            error: lastError.message,
          });

          await wait(delay);
        }
      }
    }

    this.logger.error('HTTP request failed after all retries', {
      url,
      attempts: config.maxRetries + 1,
      error: lastError?.message,
    });

    throw lastError || new Error('HTTP request failed');
  }
}
