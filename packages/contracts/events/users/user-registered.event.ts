// * User registered event

import { z } from 'zod';

import { DomainEvent } from '@lapasar/shared-kernel';

export const UserRegisteredEventSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export type UserRegisteredEventPayload = z.infer<typeof UserRegisteredEventSchema>;

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly payload: UserRegisteredEventPayload,
    metadata = {}
  ) {
    super('UserRegistered', payload.userId, metadata);
  }

  getPayload(): Record<string, unknown> {
    return this.payload;
  }
}
