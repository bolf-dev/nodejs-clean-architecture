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
