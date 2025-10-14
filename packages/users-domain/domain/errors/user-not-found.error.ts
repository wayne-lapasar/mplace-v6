// * User not found error

import { LocalizedError } from '@lapasar/shared-kernel';

export class UserNotFoundError extends LocalizedError {
  constructor(userId?: string) {
    const message = userId ? `User with ID "${userId}" not found` : 'User not found';
    super(
      message,
      'USER_NOT_FOUND',
      404,
      'users.errors.userNotFound',
      userId ? { userId } : undefined
    );
  }
}
