import type { MongoClient } from 'mongodb'

export interface AuditTrailEvent {
  entity: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  payload: unknown
  performedBy?: string
  occurredAt: string
}

export class AuditTrailWriter {
  private readonly collectionName = 'audit_log'

  constructor(private readonly client: MongoClient) {}

  async write(event: AuditTrailEvent) {
    const database = this.client.db()
    await database.collection<AuditTrailEvent>(this.collectionName).insertOne(event)
  }
}
