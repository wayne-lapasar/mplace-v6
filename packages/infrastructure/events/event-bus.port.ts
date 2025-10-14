// * Event bus interface

import type { DomainEvent } from '@lapasar/shared-kernel';

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: string, handler: EventHandler): void;
  unsubscribe(eventName: string, handler: EventHandler): void;
}
