import type { RaceReadModel } from '../../application/season.read-model.js';

/** A race in the body of GET /v1/races and GET /v1/races/{raceId}. Times are ISO 8601 strings in UTC. */
export class RaceResponse {
  constructor(
    readonly id: string,
    readonly season: number,
    readonly round: number,
    readonly name: string,
    readonly circuit: string,
    readonly locality: string,
    readonly country: string,
    readonly sprintQualifyingAt: string | null,
    readonly qualifyingAt: string,
    readonly raceAt: string,
  ) {}

  static from(race: RaceReadModel): RaceResponse {
    return new RaceResponse(
      race.id,
      race.season,
      race.round,
      race.name,
      race.circuit,
      race.locality,
      race.country,
      race.sprintQualifyingAt?.toISOString() ?? null,
      race.qualifyingAt.toISOString(),
      race.raceAt.toISOString(),
    );
  }
}
