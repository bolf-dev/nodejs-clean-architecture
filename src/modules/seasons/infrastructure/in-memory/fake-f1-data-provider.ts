import { type F1Driver, F1DataProvider } from '../../application/ports/f1-data-provider.port.js';
import { F1DataUnavailable } from '../../application/season.errors.js';
import type { RaceData } from '../../domain/race.entity.js';
import type { GridDriverData } from '../../domain/season-driver.entity.js';

/** F1DataProvider adapter returning the data set by a test, so no test calls the real API. */
export class FakeF1DataProvider implements F1DataProvider {
  races: RaceData[] = [];
  starters: GridDriverData[] = [];
  drivers: F1Driver[] = [];
  /** When true, every method fails as if the source could not be reached. */
  unavailable = false;

  async calendar(): Promise<RaceData[]> {
    this.failIfUnavailable();
    return this.races;
  }

  async latestRaceStarters(): Promise<GridDriverData[]> {
    this.failIfUnavailable();
    return this.starters;
  }

  async seasonDrivers(): Promise<F1Driver[]> {
    this.failIfUnavailable();
    return this.drivers;
  }

  private failIfUnavailable(): void {
    if (this.unavailable) {
      throw new F1DataUnavailable('Jolpica F1 API cannot be reached: fake outage');
    }
  }
}
