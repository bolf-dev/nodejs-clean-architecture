import type { PredictionPicks } from './prediction-picks.value-object.js';

/** One player's prediction for one race. The player and the race are referenced by id only. */
export class Prediction {
  private constructor(
    readonly id: string,
    readonly playerId: string,
    readonly raceId: string,
    private _picks: PredictionPicks,
    readonly submittedAt: Date,
    private _updatedAt: Date,
  ) {}

  /** A player's first prediction for a race. The id and the current time are passed in by the application. */
  static submit(props: { id: string; playerId: string; raceId: string; picks: PredictionPicks; now: Date }): Prediction {
    return new Prediction(props.id, props.playerId, props.raceId, props.picks, props.now, props.now);
  }

  /** Rebuilds a stored prediction, e.g. when the repository loads it from the database. */
  static reconstitute(props: {
    id: string;
    playerId: string;
    raceId: string;
    picks: PredictionPicks;
    submittedAt: Date;
    updatedAt: Date;
  }): Prediction {
    return new Prediction(props.id, props.playerId, props.raceId, props.picks, props.submittedAt, props.updatedAt);
  }

  get picks(): PredictionPicks {
    return this._picks;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** Replaces the picks of a submitted prediction; the time of the first submission is kept (R4). */
  change(picks: PredictionPicks, now: Date): void {
    this._picks = picks;
    this._updatedAt = now;
  }
}
