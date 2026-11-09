import type { RaceData } from '../../domain/race.entity.js';
import type { GridDriverData } from '../../domain/season-driver.entity.js';

/** A driver of a season as the data source lists them, including reserve drivers without a code or a number. */
export interface F1Driver {
  externalId: string;
  code: string | null;
  number: number | null;
  firstName: string;
  lastName: string;
}

/**
 * Port for the official F1 data, implemented in infrastructure, so the app never knows where the data comes from.
 * Every method throws F1DataUnavailable when the source cannot be reached or its data cannot be read (R3).
 */
export abstract class F1DataProvider {
  /** The races of the season with their session times. */
  abstract calendar(year: number): Promise<RaceData[]>;

  /** The drivers who started the latest race of the season that has results, with their team; empty before the first race (R7). */
  abstract latestRaceStarters(year: number): Promise<GridDriverData[]>;

  /** All drivers of the season, without teams. */
  abstract seasonDrivers(year: number): Promise<F1Driver[]>;
}
