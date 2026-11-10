import type { PredictionReadModel } from '../../application/prediction.read-model.js';
import { PredictionQueries } from '../../application/ports/prediction-queries.port.js';

/** PredictionQueries adapter keeping read models in memory, used by unit tests instead of the database. */
export class InMemoryPredictionQueries implements PredictionQueries {
  readonly predictions: (PredictionReadModel & { playerId: string })[] = [];

  async findMine(playerId: string, raceId: string): Promise<PredictionReadModel | null> {
    const found = this.predictions.find((prediction) => prediction.playerId === playerId && prediction.raceId === raceId);
    if (found === undefined) {
      return null;
    }
    const { playerId: _playerId, ...prediction } = found;
    return prediction;
  }
}
