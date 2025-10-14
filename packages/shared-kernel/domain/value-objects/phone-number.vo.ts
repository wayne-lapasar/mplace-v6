// * Phone number value object

import { z } from 'zod';

export const PhoneNumberSchema = z.object({
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  number: z.string().regex(/^\d{7,15}$/),
});

export class PhoneNumber {
  private constructor(
    public readonly countryCode: string,
    public readonly number: string
  ) {}

  static create(countryCode: string, number: string): PhoneNumber {
    const validated = PhoneNumberSchema.parse({ countryCode, number });
    return new PhoneNumber(validated.countryCode, validated.number);
  }

  toString(): string {
    return `${this.countryCode}${this.number}`;
  }

  toJSON() {
    return {
      countryCode: this.countryCode,
      number: this.number,
    };
  }
}
