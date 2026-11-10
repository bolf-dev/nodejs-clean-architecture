import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SeasonQueries } from '../../ports/season-queries.port.js';
import { RaceNotFound } from '../../season.errors.js';
import type { RaceReadModel } from '../../season.read-model.js';
import { GetRaceQuery } from './get-race.query.js';

@QueryHandler(GetRaceQuery)
export class GetRaceHandler implements IQueryHandler<GetRaceQuery> {
  constructor(private readonly seasonQueries: SeasonQueries) {}

  async execute(query: GetRaceQuery): Promise<RaceReadModel> {
    const race = await this.seasonQueries.findRace(query.raceId);
    if (race === null) {
      throw new RaceNotFound(query.raceId);
    }
    return race;
  }
}
