import { Query } from '@nestjs/cqrs';
import type { DriverReadModel } from '../../season.read-model.js';

/** Get the current grid of a season, ordered by code. */
export class ListDriversQuery extends Query<DriverReadModel[]> {
  constructor(readonly season: number) {
    super();
  }
}
