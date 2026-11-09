import type { DriverCode } from './driver-code.value-object.js';

export interface Team {
  id: string;
  name: string;
}

/** What the data source says about a driver of the current grid. */
export interface GridDriverData {
  /** The data source's id of the driver, e.g. `max_verstappen` */
  externalId: string;
  /** Missing for some drivers in the data source (R8) */
  code: string | null;
  number: number;
  firstName: string;
  lastName: string;
  /** Unknown before the first race of a season (R7) */
  team: Team | null;
}

/** A driver of the current grid of a season (R7, R8). Part of the Season aggregate. */
export class SeasonDriver {
  constructor(
    readonly id: string,
    readonly externalId: string,
    readonly code: DriverCode,
    readonly number: number,
    readonly firstName: string,
    readonly lastName: string,
    readonly team: Team | null,
  ) {}
}
