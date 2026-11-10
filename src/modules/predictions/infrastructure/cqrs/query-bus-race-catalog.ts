import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetRaceQuery } from '../../../seasons/application/queries/get-race/get-race.query.js';
import { ListDriversQuery } from '../../../seasons/application/queries/list-drivers/list-drivers.query.js';
import { ListRacesQuery } from '../../../seasons/application/queries/list-races/list-races.query.js';
import { RaceNotFound } from '../../../seasons/application/season.errors.js';
import { type CatalogRace, RaceCatalog } from '../../application/ports/race-catalog.port.js';

/** RaceCatalog adapter asking the public queries of the seasons module through the QueryBus. */
@Injectable()
export class QueryBusRaceCatalog implements RaceCatalog {
  constructor(private readonly queryBus: QueryBus) {}

  async seasonOf(raceId: string): Promise<number | null> {
    try {
      return (await this.queryBus.execute(new GetRaceQuery(raceId))).season;
    } catch (error) {
      if (error instanceof RaceNotFound) {
        return null;
      }
      throw error;
    }
  }

  async driverCodes(season: number): Promise<string[]> {
    return (await this.queryBus.execute(new ListDriversQuery(season))).map(({ code }) => code);
  }

  async listRaces(season: number): Promise<CatalogRace[]> {
    return (await this.queryBus.execute(new ListRacesQuery(season))).map(({ id, round, name }) => ({ id, round, name }));
  }
}
