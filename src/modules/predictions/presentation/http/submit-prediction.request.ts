import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateNested } from 'class-validator';

/** The top 3 driver codes of qualifying or of the race. */
export class PodiumRequest {
  @IsString()
  p1: string;

  @IsString()
  p2: string;

  @IsString()
  p3: string;
}

/**
 * Body of PUT /v1/races/{raceId}/predictions/me. Checks only the shape of the request,
 * the prediction rules (different drivers per podium, drivers of the season) belong to the domain.
 */
export class SubmitPredictionRequest {
  /** P1 is the pole position */
  @IsObject()
  @ValidateNested()
  @Type(() => PodiumRequest)
  qualifying: PodiumRequest;

  @IsObject()
  @ValidateNested()
  @Type(() => PodiumRequest)
  race: PodiumRequest;
}
