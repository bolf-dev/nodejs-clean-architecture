import { NotFoundError, UnauthorizedError } from '../../../shared/domain/errors.js';

export class PlayerNotFound extends NotFoundError {
  constructor(playerId: string) {
    super(`Player "${playerId}" not found`);
  }
}

/** The same error for an unknown email and a wrong password, so registered emails are not revealed (R8). */
export class InvalidCredentials extends UnauthorizedError {
  constructor() {
    super('Invalid email or password');
  }
}

/** The request has no `Authorization: Bearer …` header. */
export class AuthenticationRequired extends UnauthorizedError {
  constructor() {
    super('Authentication required');
  }
}

/** The token is malformed, signed with another secret, expired, or its player no longer exists. */
export class InvalidAccessToken extends UnauthorizedError {
  constructor() {
    super('Invalid or expired access token');
  }
}
