import { Query } from '@nestjs/cqrs';
import type { RaceReadModel } from '../../season.read-model.js';

/** Get one race by id. */
export class GetRaceQuery extends Query<RaceReadModel> {
  constructor(readonly raceId: string) {
    super();
  }
}
