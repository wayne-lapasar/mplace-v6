// * Duplicate email error

import { LocalizedError } from '@lapasar/shared-kernel';

export class DuplicateEmailError extends LocalizedError {
  constructor(email: string) {
    super(
      `User with email "${email}" already exists`,
      'DUPLICATE_EMAIL',
      409,
      'users.errors.duplicateEmail',
      { email }
    );
  }
}
