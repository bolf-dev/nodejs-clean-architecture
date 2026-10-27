import { IsString } from 'class-validator';

/**
 * Body of POST /v1/players. Checks only the shape of the request,
 * the nickname rules (length, characters) belong to the domain.
 */
export class CreatePlayerRequest {
  @IsString()
  nickname: string;
}
