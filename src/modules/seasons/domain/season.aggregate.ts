import { DriverCode } from './driver-code.value-object.js';
import { Race, type RaceData } from './race.entity.js';
import { type GridDriverData, SeasonDriver } from './season-driver.entity.js';

/** A season with its races and its current grid. A sync changes one season. */
export class Season {
  private constructor(
    readonly year: number,
    private readonly _races: Race[],
    private _drivers: SeasonDriver[],
  ) {}

  /** A season that was never synced. */
  static create(year: number): Season {
    return new Season(year, [], []);
  }

  /** Rebuilds a stored season, e.g. when the repository loads it from the database. */
  static reconstitute(props: { year: number; races: Race[]; drivers: SeasonDriver[] }): Season {
    return new Season(props.year, props.races, props.drivers);
  }

  get races(): readonly Race[] {
    return this._races;
  }

  get drivers(): readonly SeasonDriver[] {
    return this._drivers;
  }

  /**
   * Adds the race of a round, or updates it when the round already exists, so nothing is duplicated (R2, R5).
   * The new id is used only for a new race. Returns whether the race was new.
   */
  syncRace(data: RaceData, newId: string): boolean {
    const existing = this._races.find((race) => race.round === data.round);
    if (existing) {
      existing.update(data);
      return false;
    }
    this._races.push(new Race(newId, data));
    return true;
  }

  /**
   * The drivers of the season become exactly these (R9). A driver who stays keeps their id,
   * matched by the data source's id; `newId` gives the id of a driver who joins.
   */
  replaceGrid(drivers: GridDriverData[], newId: () => string): void {
    this._drivers = drivers.map((driver) => {
      const existing = this._drivers.find(({ externalId }) => externalId === driver.externalId);
      return new SeasonDriver(
        existing?.id ?? newId(),
        driver.externalId,
        DriverCode.from(driver.code, driver.lastName),
        driver.number,
        driver.firstName,
        driver.lastName,
        driver.team,
      );
    });
  }
}
