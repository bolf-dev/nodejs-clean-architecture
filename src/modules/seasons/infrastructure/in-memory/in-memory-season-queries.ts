import { SeasonQueries } from '../../application/ports/season-queries.port.js';
import type { DriverReadModel, RaceReadModel } from '../../application/season.read-model.js';

/** SeasonQueries adapter keeping read models in memory, used by unit tests instead of the database. */
export class InMemorySeasonQueries implements SeasonQueries {
  readonly races: RaceReadModel[] = [];
  readonly drivers: (DriverReadModel & { season: number })[] = [];

  async listRaces(season: number): Promise<RaceReadModel[]> {
    return this.races.filter((race) => race.season === season).sort((a, b) => a.round - b.round);
  }

  async findRace(id: string): Promise<RaceReadModel | null> {
    return this.races.find((race) => race.id === id) ?? null;
  }

  async listDrivers(season: number): Promise<DriverReadModel[]> {
    return this.drivers
      .filter((driver) => driver.season === season)
      .map(({ season: _season, ...driver }) => driver)
      // Same order as the SQL adapter: code, then id
      .sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id));
  }
}
