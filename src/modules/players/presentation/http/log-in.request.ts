import { IsString } from 'class-validator';

/** Body of POST /v1/auth/login. Checks only the shape of the request. */
export class LogInRequest {
  @IsString()
  email: string;

  @IsString()
  password: string;
}
