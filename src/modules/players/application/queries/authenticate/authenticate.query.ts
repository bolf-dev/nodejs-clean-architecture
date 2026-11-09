import { Query } from '@nestjs/cqrs';

/** Find out which player an access token belongs to. Returns the player id. */
export class AuthenticateQuery extends Query<string> {
  constructor(readonly accessToken: string) {
    super();
  }
}
