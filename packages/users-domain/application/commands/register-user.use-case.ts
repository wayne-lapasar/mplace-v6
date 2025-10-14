// * Register user use case

import { ulid } from 'ulid';

import { UserRegisteredEvent } from '@lapasar/contracts';
import type { Logger,PasswordService } from '@lapasar/infrastructure';
import type { IEventBus } from '@lapasar/infrastructure';
import { User } from '../../domain/entities/user.entity';
import { DuplicateEmailError } from '../../domain/errors';
import type { IUserRepository } from '../../ports/user.repository.port';
import type { RegisterUserDTO, UserResponseDTO } from '../dto/user.dto';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly eventBus: IEventBus,
    private readonly logger: Logger
  ) {}

  async execute(dto: RegisterUserDTO, adminUserId?: string): Promise<UserResponseDTO> {
    // * Check if email already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new DuplicateEmailError(dto.email);
    }

    // * Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // * Create user entity with ULID
    const newUserId = ulid(); // * Generate ULID first
    const user = new User(
      newUserId, // * ULID - sortable, 26 chars, timestamp-encoded
      dto.email,
      dto.name,
      passwordHash,
      ['customer'],
    );

    // * Save to database with audit trail
    // * For self-registration: createdById = newUserId (user creates themselves)
    // * For admin registration: createdById = adminUserId
    const createdById = adminUserId || newUserId;
    await this.userRepository.save(user, createdById);

    // * Publish event
    await this.eventBus.publish(
      new UserRegisteredEvent({
        userId: user.id,
        email: user.email,
        name: user.name,
      })
    );

    this.logger.info('User registered successfully', { userId: user.id });

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
