// * Get user use case

import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { IUserRepository } from '../../ports/user.repository.port';
import type { UserResponseDTO } from '../dto/user.dto';

export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
