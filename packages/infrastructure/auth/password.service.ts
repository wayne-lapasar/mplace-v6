// * Password hashing with Argon2id

import type { Logger } from '../logging/logger';

export interface Argon2Config {
  memoryCost: number; // * In KiB (19456 = 19 MiB)
  timeCost: number; // * Iterations
  parallelism: number; // * Degree of parallelism
}

export class PasswordService {
  constructor(
    private readonly config: Argon2Config,
    private readonly logger: Logger
  ) {}

  async hash(password: string): Promise<string> {
    try {
      // * Bun has built-in argon2id support
      const hash = await Bun.password.hash(password, {
        algorithm: 'argon2id',
        memoryCost: this.config.memoryCost,
        timeCost: this.config.timeCost,
      });

      return hash;
    } catch (error) {
      this.logger.error('Password hashing failed', { error });
      throw error;
    }
  }

  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await Bun.password.verify(password, hash);
    } catch (error) {
      this.logger.error('Password verification failed', { error });
      return false;
    }
  }
}
