import { DriverNotInSeason, PodiumDriversNotDifferent } from './prediction.errors.js';

/** The driver codes a player picked, e.g. `{ pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' }`. */
export interface Picks {
  pole: string;
  p1: string;
  p2: string;
  p3: string;
}

/** The drivers that can be picked for a race: the current grid of its season (R3). */
export interface SeasonGrid {
  season: number;
  driverCodes: readonly string[];
}

/**
 * The pole position and the podium of a prediction. It can only be created through `create()`,
 * so every instance follows the rules R1 to R3 of spec 007.
 */
export class PredictionPicks {
  private constructor(
    readonly pole: string,
    readonly p1: string,
    readonly p2: string,
    readonly p3: string,
  ) {}

  static create(picks: Picks, grid: SeasonGrid): PredictionPicks {
    // The pole driver may be any of the podium drivers (R2)
    if (new Set([picks.p1, picks.p2, picks.p3]).size !== 3) {
      throw new PodiumDriversNotDifferent();
    }
    for (const code of [picks.pole, picks.p1, picks.p2, picks.p3]) {
      if (!grid.driverCodes.includes(code)) {
        throw new DriverNotInSeason(code, grid.season);
      }
    }
    return new PredictionPicks(picks.pole, picks.p1, picks.p2, picks.p3);
  }

  /** Rebuilds stored picks. They are not checked against the grid again, because a driver may have left it (R5). */
  static reconstitute(picks: Picks): PredictionPicks {
    return new PredictionPicks(picks.pole, picks.p1, picks.p2, picks.p3);
  }
}
