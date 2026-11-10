import type { Prediction } from '../../domain/prediction.aggregate.js';
import { PredictionRepository } from '../../domain/prediction.repository.port.js';

/** PredictionRepository adapter keeping predictions in memory, used by unit tests instead of the database. */
export class InMemoryPredictionRepository implements PredictionRepository {
  readonly predictions: Prediction[] = [];

  async findByPlayerAndRace(playerId: string, raceId: string): Promise<Prediction | null> {
    return this.predictions.find((prediction) => prediction.playerId === playerId && prediction.raceId === raceId) ?? null;
  }

  async save(prediction: Prediction): Promise<void> {
    // Same guarantee as the unique index: one prediction per player and race
    const index = this.predictions.findIndex(
      ({ playerId, raceId }) => playerId === prediction.playerId && raceId === prediction.raceId,
    );
    if (index === -1) {
      this.predictions.push(prediction);
    } else {
      this.predictions[index] = prediction;
    }
  }
}
