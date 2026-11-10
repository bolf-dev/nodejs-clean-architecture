import type { Podium } from '../domain/prediction-picks.value-object.js';

/** A prediction as the read side returns it: flat data, no domain objects. Qualifying P1 is the pole position. */
export interface PredictionReadModel {
  raceId: string;
  qualifying: Podium;
  race: Podium;
  submittedAt: Date;
  updatedAt: Date;
}

/** A prediction in the list of a player's predictions, with the race it is for. */
export interface PlayerPredictionReadModel extends PredictionReadModel {
  round: number;
  raceName: string;
}
