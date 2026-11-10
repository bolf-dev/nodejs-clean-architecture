/** A prediction as the read side returns it: flat data, no domain objects. */
export interface PredictionReadModel {
  raceId: string;
  pole: string;
  p1: string;
  p2: string;
  p3: string;
  submittedAt: Date;
  updatedAt: Date;
}

/** A prediction in the list of a player's predictions, with the race it is for. */
export interface PlayerPredictionReadModel extends PredictionReadModel {
  round: number;
  raceName: string;
}
