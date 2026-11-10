import type { PredictionReadModel } from '../../application/prediction.read-model.js';

/** Body of GET /v1/races/{raceId}/predictions/me. Times are ISO 8601 strings in UTC. */
export class PredictionResponse {
  constructor(
    readonly raceId: string,
    readonly pole: string,
    readonly p1: string,
    readonly p2: string,
    readonly p3: string,
    readonly submittedAt: string,
    readonly updatedAt: string,
  ) {}

  static from(prediction: PredictionReadModel): PredictionResponse {
    return new PredictionResponse(
      prediction.raceId,
      prediction.pole,
      prediction.p1,
      prediction.p2,
      prediction.p3,
      prediction.submittedAt.toISOString(),
      prediction.updatedAt.toISOString(),
    );
  }
}
