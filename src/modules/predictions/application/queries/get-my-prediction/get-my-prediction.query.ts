import { Query } from '@nestjs/cqrs';
import type { PredictionReadModel } from '../../prediction.read-model.js';

/** Get the player's own prediction for a race. */
export class GetMyPredictionQuery extends Query<PredictionReadModel> {
  constructor(
    readonly playerId: string,
    readonly raceId: string,
  ) {
    super();
  }
}
