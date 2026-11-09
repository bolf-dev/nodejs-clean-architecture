import { Query } from '@nestjs/cqrs';
import type { AccessToken } from '../../ports/token-service.port.js';

/**
 * Log in with an email and a password, both raw input. Returns an access token.
 * A query, because logging in changes no state: it checks credentials and issues a token.
 */
export class LogInQuery extends Query<AccessToken> {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {
    super();
  }
}
