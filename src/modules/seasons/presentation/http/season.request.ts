import { Matches } from 'class-validator';

/** Query string `?season=2026` of GET /v1/races and GET /v1/drivers. */
export class SeasonRequest {
  @Matches(/^\d{4}$/, { message: 'season must be a year' })
  season: string;
}
