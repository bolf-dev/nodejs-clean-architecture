import { NotFoundError } from '../../../shared/domain/errors.js';

export class RaceNotFound extends NotFoundError {
  constructor(raceId: string) {
    super(`Race "${raceId}" not found`);
  }
}

export class PlayerNotFound extends NotFoundError {
  constructor(playerId: string) {
    super(`Player "${playerId}" not found`);
  }
}

/** The player has no prediction for the race, or no race has the id. */
export class PredictionNotFound extends NotFoundError {
  constructor() {
    super('Prediction not found');
  }
}
