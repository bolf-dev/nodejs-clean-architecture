import type { PlayerPredictionReadModel } from '../../application/prediction.read-model.js';

/** A prediction in the body of GET /v1/players/{playerId}/predictions. Times are ISO 8601 strings in UTC. */
interface PlayerPredictionItem {
  raceId: string;
  round: number;
  raceName: string;
  pole: string;
  p1: string;
  p2: string;
  p3: string;
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
        pole: prediction.pole,
        p1: prediction.p1,
        p2: prediction.p2,
        p3: prediction.p3,
        submittedAt: prediction.submittedAt.toISOString(),
        updatedAt: prediction.updatedAt.toISOString(),
      })),
    );
  }
}
