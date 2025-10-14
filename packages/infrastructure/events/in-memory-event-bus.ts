// * In-memory event bus for monolith

import type { DomainEvent } from '@lapasar/shared-kernel';
import type { Logger } from '../logging/logger';
import type { EventHandler,IEventBus } from './event-bus.port';

export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  constructor(private readonly logger: Logger) {}

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) || new Set();

    this.logger.debug('Publishing event', {
      eventName: event.eventName,
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      handlerCount: handlers.size,
    });

    // * Execute all handlers
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error('Event handler failed', {
          eventName: event.eventName,
          error,
        });
      }
    });

    await Promise.all(promises);
  }

  subscribe(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);

    this.logger.debug('Event handler subscribed', {
      eventName,
      totalHandlers: this.handlers.get(eventName)!.size,
    });
  }

  unsubscribe(eventName: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}
