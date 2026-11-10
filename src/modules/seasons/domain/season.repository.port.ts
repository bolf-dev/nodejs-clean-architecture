import type { Season } from './season.aggregate.js';

/**
 * Port for storing seasons, implemented in infrastructure.
 * An abstract class instead of an interface, because NestJS needs it as an injection token at runtime.
 */
export abstract class SeasonRepository {
  /** The season with its races and drivers, or null when it was never synced. */
  abstract findByYear(year: number): Promise<Season | null>;

  /** Stores the races and the grid of the season at once: either everything is saved, or nothing (R3). */
  abstract save(season: Season): Promise<void>;
}
