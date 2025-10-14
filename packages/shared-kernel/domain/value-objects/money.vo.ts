// * Money value object with currency support

import { z } from 'zod';

export const CurrencySchema = z.enum(['USD', 'EUR', 'MYR', 'SGD', 'GBP']);
export type Currency = z.infer<typeof CurrencySchema>;

export const MoneySchema = z.object({
  amount: z.number().nonnegative('Amount must be non-negative'),
  currency: CurrencySchema,
});

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: Currency
  ) {}

  static create(amount: number, currency: Currency = 'MYR'): Money {
    const validated = MoneySchema.parse({ amount, currency });
    return new Money(validated.amount, validated.currency);
  }

  static zero(currency: Currency = 'MYR'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Cannot subtract to negative amount');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor must be non-negative');
    }
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: ${this.currency} vs ${other.currency}`
      );
    }
  }

  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }
}
