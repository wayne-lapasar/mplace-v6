// * Email value object with validation

import { z } from 'zod';

export const EmailSchema = z
  .string()
  .email('Invalid email format')
  .min(5)
  .max(255)
  .toLowerCase()
  .trim();

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const validated = EmailSchema.parse(email);
    return new Email(validated);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
