// * Rate limiter service using sliding window algorithm

import type { ICache } from '../cache/cache.port';

export interface RateLimitConfig {
  windowMs: number; // * Time window in milliseconds
  maxRequests: number; // * Maximum requests per window
  keyPrefix?: string; // * Optional prefix for cache keys
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // * Seconds until next allowed request
}

export class RateLimiterService {
  constructor(
    private readonly cache: ICache,
    private readonly config: RateLimitConfig
  ) {}

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.buildKey(identifier);
    const now = Date.now();

    // * Get current count
    const currentCount = await this.getCurrentCount(key);
    const allowed = currentCount < this.config.maxRequests;

    if (allowed) {
      // * Increment counter
      await this.incrementCount(key);
    }

    // * Calculate reset time (end of current window)
    const resetTime = new Date(now + this.config.windowMs);
    const remaining = Math.max(0, this.config.maxRequests - currentCount - (allowed ? 1 : 0));

    const result: RateLimitResult = {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime,
    };

    if (!allowed) {
      // * Calculate retry after (seconds until window reset)
      result.retryAfter = Math.ceil(this.config.windowMs / 1000);
    }

    return result;
  }

  async reset(identifier: string): Promise<void> {
    const key = this.buildKey(identifier);
    await this.cache.delete(key);
  }

  private async getCurrentCount(key: string): Promise<number> {
    const value = await this.cache.get<number>(key);
    return value || 0;
  }

  private async incrementCount(key: string): Promise<void> {
    const current = await this.getCurrentCount(key);
    const ttlSeconds = Math.ceil(this.config.windowMs / 1000);

    await this.cache.set(key, current + 1, ttlSeconds);
  }

  private buildKey(identifier: string): string {
    const prefix = this.config.keyPrefix || 'ratelimit';
    return `${prefix}:${identifier}`;
  }
}