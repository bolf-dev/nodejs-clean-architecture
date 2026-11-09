import { IsString } from 'class-validator';

/**
 * Body of POST /v1/players. Checks only the shape of the request; the email, nickname
 * and password rules belong to the domain. The fields are checked in this order.
 */
export class RegisterPlayerRequest {
  @IsString()
  email: string;

  @IsString()
  nickname: string;

  @IsString()
  password: string;
}
