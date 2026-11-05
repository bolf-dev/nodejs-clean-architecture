import { NotFoundError } from '../../../shared/domain/errors.js';

export class PlayerNotFound extends NotFoundError {
  constructor(playerId: string) {
    super(`Player "${playerId}" not found`);
  }
}
