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
