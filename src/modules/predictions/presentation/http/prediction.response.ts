import type { PredictionReadModel } from '../../application/prediction.read-model.js';
import type { Podium } from '../../domain/prediction-picks.value-object.js';

/** Body of GET /v1/races/{raceId}/predictions/me. Times are ISO 8601 strings in UTC. */
export class PredictionResponse {
  constructor(
    readonly raceId: string,
    /** P1 is the pole position */
    readonly qualifying: Podium,
    readonly race: Podium,
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
