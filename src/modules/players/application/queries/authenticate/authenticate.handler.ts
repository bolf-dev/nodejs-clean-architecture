import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InvalidAccessToken } from '../../player.errors.js';
import { PlayerQueries } from '../../ports/player-queries.port.js';
import { TokenService } from '../../ports/token-service.port.js';
import { AuthenticateQuery } from './authenticate.query.js';

@QueryHandler(AuthenticateQuery)
export class AuthenticateHandler implements IQueryHandler<AuthenticateQuery> {
  constructor(
    private readonly tokenService: TokenService,
    private readonly playerQueries: PlayerQueries,
  ) {}

  async execute(query: AuthenticateQuery): Promise<string> {
    const playerId = await this.tokenService.verify(query.accessToken);

    // A valid token of a player who no longer exists is rejected as well
    if (playerId === null || (await this.playerQueries.findById(playerId)) === null) {
      throw new InvalidAccessToken();
    }

    return playerId;
  }
}
