export interface IdempotencyRecord {
  key: string
  responseHash: string
  createdAt: number
  expiresAt: number
}

export class InMemoryIdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>()

  async save(record: IdempotencyRecord) {
    this.records.set(record.key, record)
  }

  async find(key: string) {
    const record = this.records.get(key)

    if (!record) {
      return null
    }

    if (record.expiresAt < Date.now()) {
      this.records.delete(key)
      return null
    }

    return record
  }
}
