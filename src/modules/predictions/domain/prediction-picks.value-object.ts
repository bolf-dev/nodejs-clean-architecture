import { DriverNotInSeason, PodiumDriversNotDifferent } from './prediction.errors.js';

/** The top 3 driver codes of a session, e.g. `{ p1: 'VER', p2: 'NOR', p3: 'LEC' }`. */
export interface Podium {
  p1: string;
  p2: string;
  p3: string;
}

/** The drivers a player picked: the top 3 of qualifying, whose P1 is the pole position, and the podium of the race. */
export interface Picks {
  qualifying: Podium;
  race: Podium;
}

/** The drivers that can be picked for a race: the current grid of its season (R3). */
export interface SeasonGrid {
  season: number;
  driverCodes: readonly string[];
}

const codesOf = ({ p1, p2, p3 }: Podium): string[] => [p1, p2, p3];

/**
 * The top 3 of qualifying and the podium of the race of a prediction. It can only be created through `create()`,
 * so every instance follows the rules R1 to R3 of spec 007.
 */
export class PredictionPicks {
  private constructor(
    readonly qualifying: Readonly<Podium>,
    readonly race: Readonly<Podium>,
  ) {}

  static create(picks: Picks, grid: SeasonGrid): PredictionPicks {
    // Each podium has three different drivers, but a driver may be on both (R2)
    if (new Set(codesOf(picks.qualifying)).size !== 3) {
      throw new PodiumDriversNotDifferent('Qualifying');
    }
    if (new Set(codesOf(picks.race)).size !== 3) {
      throw new PodiumDriversNotDifferent('Race');
    }
    for (const code of [...codesOf(picks.qualifying), ...codesOf(picks.race)]) {
      if (!grid.driverCodes.includes(code)) {
        throw new DriverNotInSeason(code, grid.season);
      }
    }
    return PredictionPicks.reconstitute(picks);
  }

  /** Rebuilds stored picks. They are not checked against the grid again, because a driver may have left it (R5). */
  static reconstitute(picks: Picks): PredictionPicks {
    const { qualifying, race } = picks;
    return new PredictionPicks(
      Object.freeze({ p1: qualifying.p1, p2: qualifying.p2, p3: qualifying.p3 }),
      Object.freeze({ p1: race.p1, p2: race.p2, p3: race.p3 }),
    );
  }
}
