import { Query } from '@nestjs/cqrs';
import type { RaceReadModel } from '../../season.read-model.js';

/** Get the calendar of a season, ordered by round. */
export class ListRacesQuery extends Query<RaceReadModel[]> {
  constructor(readonly season: number) {
    super();
  }
}
