import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SeasonQueries } from '../../ports/season-queries.port.js';
import type { DriverReadModel } from '../../season.read-model.js';
import { ListDriversQuery } from './list-drivers.query.js';

@QueryHandler(ListDriversQuery)
export class ListDriversHandler implements IQueryHandler<ListDriversQuery> {
  constructor(private readonly seasonQueries: SeasonQueries) {}

  execute(query: ListDriversQuery): Promise<DriverReadModel[]> {
    return this.seasonQueries.listDrivers(query.season);
  }
}
