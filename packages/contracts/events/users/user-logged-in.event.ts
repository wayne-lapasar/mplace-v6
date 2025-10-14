// * User logged in event

import { z } from 'zod';

import { DomainEvent } from '@lapasar/shared-kernel';

export const UserLoggedInEventSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  timestamp: z.date(),
});

export type UserLoggedInEventPayload = z.infer<typeof UserLoggedInEventSchema>;

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly payload: UserLoggedInEventPayload,
    metadata = {}
  ) {
    super('UserLoggedIn', payload.userId, metadata);
  }

  getPayload(): Record<string, unknown> {
    return { ...this.payload, timestamp: this.payload.timestamp.toISOString() };
  }
}
