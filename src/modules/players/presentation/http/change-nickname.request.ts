import { IsString } from 'class-validator';

/**
 * Body of PATCH /v1/players/{playerId}. Checks only the shape of the request,
 * the nickname rules (length, characters) belong to the domain.
 */
export class ChangeNicknameRequest {
  @IsString()
  nickname: string;
}
