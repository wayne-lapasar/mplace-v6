// * Redis cache implementation using Bun's built-in Redis client

import type { ICache } from './cache.port';

interface BunRedis {
  del(...keys: string[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  quit(): Promise<void>;
  set(key: string, value: string): Promise<void>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  ttl(key: string): Promise<number>;
}

export class BunRedisCache implements ICache {
  private redis: BunRedis;

  constructor(url: string) {
    // @ts-expect-error Bun's Redis is not typed yet
    this.redis = new Bun.Redis({ url });
  }

  async clear(): Promise<void> {
    // * Get all keys and delete them (use with caution)
    const keys = await this.redis.keys('*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  // * Rate limiting specific methods
  async increment(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.redis.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  async has(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  // * Additional helper methods for rate limiting
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}