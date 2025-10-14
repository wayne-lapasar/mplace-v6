// * Base class for all domain events

import { ulid } from 'ulid';

import type { ID, UUID } from '../../types/common.types';

export interface EventMetadata {
  correlationId?: string; // * Tracks related events across requests
  causationId?: string; // * ID of the event that caused this event
  userId?: ID; // * User who triggered the event
  traceId?: string; // * Distributed tracing ID
}

export abstract class DomainEvent {
  public readonly eventId: UUID;
  public readonly eventName: string;
  public readonly occurredAt: Date;
  public readonly aggregateId: ID;
  public readonly metadata: EventMetadata;

  constructor(
    eventName: string,
    aggregateId: ID,
    metadata: EventMetadata = {}
  ) {
    this.eventId = ulid(); // * ULID instead of UUID
    this.eventName = eventName;
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.metadata = metadata;
  }

  // * Serialize event to plain object
  toJSON() {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId,
      metadata: this.metadata,
      payload: this.getPayload(),
    };
  }

  // * Each event must define its payload
  abstract getPayload(): Record<string, unknown>;
}
