import type { PredictionReadModel } from '../prediction.read-model.js';

/** Port for reading predictions on the read side, implemented in infrastructure. */
export abstract class PredictionQueries {
  /** The player's prediction for the race, or null when there is none. */
  abstract findMine(playerId: string, raceId: string): Promise<PredictionReadModel | null>;
}
