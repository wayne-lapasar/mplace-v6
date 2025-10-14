// * Invalid credentials error

import { LocalizedError } from '@lapasar/shared-kernel';

export class InvalidCredentialsError extends LocalizedError {
  constructor() {
    super(
      'Invalid email or password',
      'INVALID_CREDENTIALS',
      401,
      'users.errors.invalidCredentials'
    );
  }
}
