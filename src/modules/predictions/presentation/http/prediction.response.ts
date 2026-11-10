import type { PredictionReadModel } from '../../application/prediction.read-model.js';

/** The top 3 driver codes of qualifying or of the race. */
export interface PodiumResponse {
  p1: string;
  p2: string;
  p3: string;
}

/** Body of GET /v1/races/{raceId}/predictions/me. Times are ISO 8601 strings in UTC. */
export class PredictionResponse {
  constructor(
    readonly raceId: string,
    /** P1 is the pole position */
    readonly qualifying: PodiumResponse,
    readonly race: PodiumResponse,
    readonly submittedAt: string,
    readonly updatedAt: string,
  ) {}

  static from(prediction: PredictionReadModel): PredictionResponse {
    return new PredictionResponse(
      prediction.raceId,
      { ...prediction.qualifying },
      { ...prediction.race },
      prediction.submittedAt.toISOString(),
      prediction.updatedAt.toISOString(),
    );
  }
}
