import { Query } from '@nestjs/cqrs';
import type { PlayerPredictionReadModel } from '../../prediction.read-model.js';

/** Get the predictions of a player in a season that the viewer (the logged-in player) may see, ordered by round. */
export class ListPlayerPredictionsQuery extends Query<PlayerPredictionReadModel[]> {
  constructor(
    readonly viewerId: string,
    readonly playerId: string,
    readonly season: number,
  ) {
    super();
  }
}
