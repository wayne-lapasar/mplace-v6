// * JWT token generation and validation

import { jwtVerify, SignJWT } from 'jose';
import { TextEncoder } from 'node:util';

import type { Logger } from '../logging/logger';

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  [key: string]: unknown;
}

export class JWTService {
  private secret: Uint8Array;

  constructor(
    secret: string,
    private readonly expiresIn: string,
    private readonly logger: Logger
  ) {
    this.secret = new TextEncoder().encode(secret);
  }

  async sign(payload: JWTPayload): Promise<string> {
    try {
      const jwt = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(this.expiresIn)
        .sign(this.secret);

      return jwt;
    } catch (error) {
      this.logger.error('JWT signing failed', { error });
      throw error;
    }
  }

  async verify(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      return payload as JWTPayload;
    } catch (error) {
      this.logger.error('JWT verification failed', { error });
      throw error;
    }
  }
}
