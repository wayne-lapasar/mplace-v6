// * Update user profile use case

import type { Logger } from '@lapasar/infrastructure';
import { DuplicateEmailError, UserNotFoundError } from '../../domain/errors';
import type { IUserRepository } from '../../ports/user.repository.port';
import type { UpdateUserProfileDTO, UserResponseDTO } from '../dto/user.dto';

export class UpdateUserProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: Logger
  ) {}

  async execute(
    userId: string,
    dto: UpdateUserProfileDTO,
    updatedByUserId: string
  ): Promise<UserResponseDTO> {
    // * Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // * Check if email is being changed and already exists
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new DuplicateEmailError(dto.email);
      }
    }

    // * Update user properties
    if (dto.name) {
      user.name = dto.name;
    }

    if (dto.email) {
      user.email = dto.email;
    }

    // * Save with audit trail
    const updatedUser = await this.userRepository.update(user, updatedByUserId);

    this.logger.info('User profile updated successfully', { userId: user.id });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      roles: updatedUser.roles,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
    };
  }
}
