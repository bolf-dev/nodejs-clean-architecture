import type { DriverReadModel, RaceReadModel } from '../season.read-model.js';

/** Port for reading races and drivers on the read side, implemented in infrastructure. */
export abstract class SeasonQueries {
  /** The races of the season ordered by round; empty for a season that was never synced. */
  abstract listRaces(season: number): Promise<RaceReadModel[]>;

  abstract findRace(id: string): Promise<RaceReadModel | null>;

  /** The current grid of the season ordered by code. */
  abstract listDrivers(season: number): Promise<DriverReadModel[]>;
}
