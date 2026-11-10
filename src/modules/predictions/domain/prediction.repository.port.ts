import type { Prediction } from './prediction.aggregate.js';

/**
 * Port for storing predictions, implemented in infrastructure.
 * An abstract class instead of an interface, because NestJS needs it as an injection token at runtime.
 */
export abstract class PredictionRepository {
  /** The player's prediction for the race, or null when they have not predicted it yet. */
  abstract findByPlayerAndRace(playerId: string, raceId: string): Promise<Prediction | null>;

  /** Inserts a new prediction or updates the player's prediction for the race (R4). */
  abstract save(prediction: Prediction): Promise<void>;
}
