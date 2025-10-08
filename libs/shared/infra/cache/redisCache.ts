import type { RedisConfig } from '@shared/interfaces/config'

export interface CacheClient {
  get<TValue>(key: string): Promise<TValue | null>
  set<TValue>(key: string, value: TValue, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<void>
}

export class InMemoryCache implements CacheClient {
  private readonly store = new Map<string, { value: unknown; expiresAt?: number }>()

  constructor(private readonly config: RedisConfig) {}

  async get<TValue>(key: string): Promise<TValue | null> {
    const namespacedKey = this.namespaced(key)
    const record = this.store.get(namespacedKey)

    if (!record) {
      return null
    }

    if (record.expiresAt && record.expiresAt < Date.now()) {
      this.store.delete(namespacedKey)
      return null
    }

    return record.value as TValue
  }

  async set<TValue>(key: string, value: TValue, ttlSeconds?: number) {
    const namespacedKey = this.namespaced(key)
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1_000 : undefined

    this.store.set(namespacedKey, { value, expiresAt })
  }

  async delete(key: string) {
    const namespacedKey = this.namespaced(key)
    this.store.delete(namespacedKey)
  }

  private namespaced(key: string) {
    return `${this.config.prefix ?? 'cache'}:${key}`
  }
}
