import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SeasonQueries } from '../../ports/season-queries.port.js';
import type { RaceReadModel } from '../../season.read-model.js';
import { ListRacesQuery } from './list-races.query.js';

@QueryHandler(ListRacesQuery)
export class ListRacesHandler implements IQueryHandler<ListRacesQuery> {
  constructor(private readonly seasonQueries: SeasonQueries) {}

  execute(query: ListRacesQuery): Promise<RaceReadModel[]> {
    return this.seasonQueries.listRaces(query.season);
  }
}
