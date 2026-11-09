import { type AccessToken, TokenService } from '../../application/ports/token-service.port.js';

const PREFIX = 'token-';

/** TokenService adapter for unit tests: the token is `token-<playerId>` and never expires. */
export class FakeTokenService implements TokenService {
  static readonly EXPIRES_AT = new Date('2026-11-16T10:00:00.000Z');

  async issue(playerId: string): Promise<AccessToken> {
    return { accessToken: `${PREFIX}${playerId}`, expiresAt: FakeTokenService.EXPIRES_AT };
  }

  async verify(token: string): Promise<string | null> {
    return token.startsWith(PREFIX) ? token.slice(PREFIX.length) : null;
  }
}
