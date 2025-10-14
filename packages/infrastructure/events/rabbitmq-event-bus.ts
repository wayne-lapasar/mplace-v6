// * RabbitMQ event bus for microservices (placeholder)

import type { DomainEvent } from '@lapasar/shared-kernel';
import type { EventHandler,IEventBus } from './event-bus.port';

export class RabbitMQEventBus implements IEventBus {
  async publish(_event: DomainEvent): Promise<void> {
    // TODO: Implement RabbitMQ publishing
    throw new Error('RabbitMQ event bus not yet implemented');
  }

  subscribe(_eventName: string, _handler: EventHandler): void {
    // TODO: Implement RabbitMQ subscription
    throw new Error('RabbitMQ event bus not yet implemented');
  }

  unsubscribe(_eventName: string, _handler: EventHandler): void {
    // TODO: Implement RabbitMQ unsubscription
    throw new Error('RabbitMQ event bus not yet implemented');
  }
}
