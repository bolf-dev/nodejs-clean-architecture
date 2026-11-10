import type { RaceReadModel } from '../../application/season.read-model.js';
import { RaceResponse } from './race.response.js';

/** Body of GET /v1/races, wrapped in an object like the list of players. */
export class RacesListResponse {
  constructor(readonly races: RaceResponse[]) {}

  static from(races: RaceReadModel[]): RacesListResponse {
    return new RacesListResponse(races.map((race) => RaceResponse.from(race)));
  }
}
