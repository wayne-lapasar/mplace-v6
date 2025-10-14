// * Login user use case

import { UserLoggedInEvent } from '@lapasar/contracts';
import type { IEventBus, JWTService, Logger,PasswordService } from '@lapasar/infrastructure';
import { InvalidCredentialsError } from '../../domain/errors';
import type { IUserRepository } from '../../ports/user.repository.port';
import type { LoginResponseDTO,LoginUserDTO } from '../dto/user.dto';

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JWTService,
    private readonly eventBus: IEventBus,
    private readonly logger: Logger
  ) {}

  async execute(dto: LoginUserDTO): Promise<LoginResponseDTO> {
    // * Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // * Verify password
    const isValid = await this.passwordService.verify(
      dto.password,
      user.passwordHash
    );

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // * Check if user is active
    if (!user.isActive) {
      throw new InvalidCredentialsError();
    }

    // * Generate JWT token
    const token = await this.jwtService.sign({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    // * Publish event
    await this.eventBus.publish(
      new UserLoggedInEvent({
        userId: user.id,
        email: user.email,
        timestamp: new Date(),
      })
    );

    this.logger.info('User logged in successfully', { userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }
}
