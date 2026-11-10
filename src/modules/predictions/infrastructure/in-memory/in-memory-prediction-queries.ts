import type { PredictionReadModel } from '../../application/prediction.read-model.js';
import { PredictionQueries } from '../../application/ports/prediction-queries.port.js';

/** PredictionQueries adapter keeping read models in memory, used by unit tests instead of the database. */
export class InMemoryPredictionQueries implements PredictionQueries {
  readonly predictions: (PredictionReadModel & { playerId: string })[] = [];

  async findMine(playerId: string, raceId: string): Promise<PredictionReadModel | null> {
    return (await this.listByPlayer(playerId, [raceId]))[0] ?? null;
  }

  async listByPlayer(playerId: string, raceIds: string[]): Promise<PredictionReadModel[]> {
    return this.predictions
      .filter((prediction) => prediction.playerId === playerId && raceIds.includes(prediction.raceId))
      .map(({ playerId: _playerId, ...prediction }) => prediction);
  }
}
