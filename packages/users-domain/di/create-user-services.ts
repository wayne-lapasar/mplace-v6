// * Factory function to initialize all user domain services

import type { Db } from 'mongodb';

import type { IEventBus, JWTService,Logger, PasswordService } from '@lapasar/infrastructure';
import { LoginUserUseCase, RegisterUserUseCase, UpdateUserProfileUseCase } from '../application/commands';
import { GetUserUseCase } from '../application/queries';
import { UserRepository } from '../infrastructure/persistence/user.repository';
import type { IUserRepository } from '../ports/user.repository.port';

export interface UserServiceDependencies {
  db: Db;
  logger: Logger;
  passwordService: PasswordService;
  jwtService: JWTService;
  eventBus: IEventBus;
}

export interface UserServices {
  // * Repositories
  userRepository: IUserRepository;

  // * Use cases
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  updateUserProfileUseCase: UpdateUserProfileUseCase;
  getUserUseCase: GetUserUseCase;
}

export function createUserServices(deps: UserServiceDependencies): UserServices {
  // * Initialize repository
  const userRepository = new UserRepository(deps.db, deps.logger);

  // * Initialize use cases
  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    deps.passwordService,
    deps.eventBus,
    deps.logger
  );

  const loginUserUseCase = new LoginUserUseCase(
    userRepository,
    deps.passwordService,
    deps.jwtService,
    deps.eventBus,
    deps.logger
  );

  const updateUserProfileUseCase = new UpdateUserProfileUseCase(
    userRepository,
    deps.logger
  );

  const getUserUseCase = new GetUserUseCase(userRepository);

  return {
    userRepository,
    registerUserUseCase,
    loginUserUseCase,
    updateUserProfileUseCase,
    getUserUseCase,
  };
}