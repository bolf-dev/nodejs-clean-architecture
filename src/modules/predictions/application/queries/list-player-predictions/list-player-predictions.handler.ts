import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PlayerNotFound } from '../../prediction.errors.js';
import type { PlayerPredictionReadModel } from '../../prediction.read-model.js';
import { PlayerDirectory } from '../../ports/player-directory.port.js';
import { PredictionQueries } from '../../ports/prediction-queries.port.js';
import { RaceCatalog } from '../../ports/race-catalog.port.js';
import { ListPlayerPredictionsQuery } from './list-player-predictions.query.js';

@QueryHandler(ListPlayerPredictionsQuery)
export class ListPlayerPredictionsHandler implements IQueryHandler<ListPlayerPredictionsQuery> {
  constructor(
    private readonly playerDirectory: PlayerDirectory,
    private readonly raceCatalog: RaceCatalog,
    private readonly predictionQueries: PredictionQueries,
  ) {}

  async execute(query: ListPlayerPredictionsQuery): Promise<PlayerPredictionReadModel[]> {
    if (!(await this.playerDirectory.exists(query.playerId))) {
      throw new PlayerNotFound(query.playerId);
    }
    // Other players' predictions are visible only for finished races, and races finish from 008 on (R8)
    if (query.viewerId !== query.playerId) {
      return [];
    }

    const races = await this.raceCatalog.listRaces(query.season);
    const predictions = await this.predictionQueries.listByPlayer(
      query.playerId,
      races.map(({ id }) => id),
    );
    // The races come ordered by round, so the predictions follow that order (R7)
    return races.flatMap((race) => {
      const prediction = predictions.find(({ raceId }) => raceId === race.id);
      return prediction ? [{ ...prediction, round: race.round, raceName: race.name }] : [];
    });
  }
}
