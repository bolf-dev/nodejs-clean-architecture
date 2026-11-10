import { RaceCatalog } from '../../application/ports/race-catalog.port.js';

/** RaceCatalog adapter with races and drivers set by the test, used by unit tests instead of the seasons module. */
export class FakeRaceCatalog implements RaceCatalog {
  /** Race id → season */
  readonly races = new Map<string, number>();
  /** Season → driver codes */
  readonly drivers = new Map<number, string[]>();

  async seasonOf(raceId: string): Promise<number | null> {
    return this.races.get(raceId) ?? null;
  }

  async driverCodes(season: number): Promise<string[]> {
    return this.drivers.get(season) ?? [];
  }
}
