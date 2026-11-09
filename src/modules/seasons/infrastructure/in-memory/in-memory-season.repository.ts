import type { Season } from '../../domain/season.aggregate.js';
import { SeasonRepository } from '../../domain/season.repository.port.js';

/** SeasonRepository adapter keeping seasons in memory, used by unit tests instead of the database. */
export class InMemorySeasonRepository implements SeasonRepository {
  readonly seasons = new Map<number, Season>();

  async findByYear(year: number): Promise<Season | null> {
    return this.seasons.get(year) ?? null;
  }

  async save(season: Season): Promise<void> {
    this.seasons.set(season.year, season);
  }
}
