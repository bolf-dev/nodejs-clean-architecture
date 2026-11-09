/** A race as the read side returns it: flat data, no domain objects. */
export interface RaceReadModel {
  id: string;
  season: number;
  round: number;
  name: string;
  circuit: string;
  locality: string;
  country: string;
  sprintQualifyingAt: Date | null;
  qualifyingAt: Date;
  raceAt: Date;
}

/** A driver of the current grid of a season, as the read side returns it. */
export interface DriverReadModel {
  id: string;
  code: string;
  number: number;
  firstName: string;
  lastName: string;
  team: { id: string; name: string } | null;
}
