import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type AccessToken, TokenService } from '../../application/ports/token-service.port.js';

const LIFETIME_SECONDS = 7 * 24 * 60 * 60;

/** TokenService with JSON Web Tokens signed by @nestjs/jwt. The subject `sub` is the player id. */
@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async issue(playerId: string): Promise<AccessToken> {
    // The expiry is set explicitly, so the returned expiresAt is exactly the one in the token
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + LIFETIME_SECONDS;
    const accessToken = await this.jwtService.signAsync({ sub: playerId, exp: expiresAtSeconds });
    return { accessToken, expiresAt: new Date(expiresAtSeconds * 1000) };
  }

  async verify(token: string): Promise<string | null> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: unknown }>(token);
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      // Malformed, signed with another secret or expired
      return null;
    }
  }
}
