// * Address value object

import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).toUpperCase(), // * ISO 3166-1 alpha-2
});

export type AddressProps = z.infer<typeof AddressSchema>;

export class Address {
  private constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly state: string,
    public readonly postalCode: string,
    public readonly country: string
  ) {}

  static create(props: AddressProps): Address {
    const validated = AddressSchema.parse(props);
    return new Address(
      validated.street,
      validated.city,
      validated.state,
      validated.postalCode,
      validated.country
    );
  }

  toString(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.postalCode}, ${this.country}`;
  }

  toJSON(): AddressProps {
    return {
      street: this.street,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
    };
  }
}
