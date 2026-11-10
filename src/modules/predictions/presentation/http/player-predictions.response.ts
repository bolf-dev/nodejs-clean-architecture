import type { PlayerPredictionReadModel } from '../../application/prediction.read-model.js';
import type { Podium } from '../../domain/prediction-picks.value-object.js';

/** A prediction in the body of GET /v1/players/{playerId}/predictions. Times are ISO 8601 strings in UTC. */
interface PlayerPredictionItem {
  raceId: string;
  round: number;
  raceName: string;
  /** P1 is the pole position */
  qualifying: Podium;
  race: Podium;
  submittedAt: string;
  updatedAt: string;
}

/** Body of GET /v1/players/{playerId}/predictions, wrapped in an object like the other lists. */
export class PlayerPredictionsResponse {
  constructor(readonly predictions: PlayerPredictionItem[]) {}

  static from(predictions: PlayerPredictionReadModel[]): PlayerPredictionsResponse {
    return new PlayerPredictionsResponse(
      predictions.map((prediction) => ({
        raceId: prediction.raceId,
        round: prediction.round,
        raceName: prediction.raceName,
        qualifying: { ...prediction.qualifying },
        race: { ...prediction.race },
        submittedAt: prediction.submittedAt.toISOString(),
        updatedAt: prediction.updatedAt.toISOString(),
      })),
    );
  }
}
