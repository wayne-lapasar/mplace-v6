import type { SecurityConfig } from '@shared/interfaces/config'

export interface JwtPayload {
  sub: string
  exp: number
  iat: number
  [key: string]: unknown
}

export class JwtService {
  constructor(private readonly config: SecurityConfig) {}

  async sign(payload: Record<string, unknown>, expiresIn = this.config.jwtExpiresIn) {
    throw new Error('JWT signing not implemented. Plug in provider from security layer.')
  }

  async verify<TPayload extends Record<string, unknown>>(
    token: string
  ): Promise<TPayload & JwtPayload> {
    throw new Error('JWT verification not implemented. Plug in provider from security layer.')
  }
}
