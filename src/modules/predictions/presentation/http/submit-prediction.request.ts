import { IsString } from 'class-validator';

/**
 * Body of PUT /v1/races/{raceId}/predictions/me. Checks only the shape of the request,
 * the prediction rules (different podium drivers, drivers of the season) belong to the domain.
 */
export class SubmitPredictionRequest {
  @IsString()
  pole: string;

  @IsString()
  p1: string;

  @IsString()
  p2: string;

  @IsString()
  p3: string;
}
