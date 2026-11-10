/** A race of a season, as far as predictions need it. */
export interface CatalogRace {
  id: string;
  round: number;
  name: string;
}

/**
 * Port for the races and drivers a prediction refers to. They belong to the seasons module,
 * so the adapter asks its queries instead of reading its tables (constitution 2).
 */
export abstract class RaceCatalog {
  /** The season of the race, or null when no race has this id. */
  abstract seasonOf(raceId: string): Promise<number | null>;

  /** The codes of the drivers of the season's current grid (R3). */
  abstract driverCodes(season: number): Promise<string[]>;

  /** The races of the season, ordered by round. */
  abstract listRaces(season: number): Promise<CatalogRace[]>;
}
