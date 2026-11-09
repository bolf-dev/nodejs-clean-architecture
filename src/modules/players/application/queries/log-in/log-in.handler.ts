import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Email } from '../../../domain/email.value-object.js';
import { InvalidEmail } from '../../../domain/player.errors.js';
import { InvalidCredentials } from '../../player.errors.js';
import { PasswordHasher } from '../../ports/password-hasher.port.js';
import { PlayerQueries } from '../../ports/player-queries.port.js';
import { type AccessToken, TokenService } from '../../ports/token-service.port.js';
import { LogInQuery } from './log-in.query.js';

@QueryHandler(LogInQuery)
export class LogInHandler implements IQueryHandler<LogInQuery> {
  constructor(
    private readonly playerQueries: PlayerQueries,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(query: LogInQuery): Promise<AccessToken> {
    const credentials = await this.playerQueries.findCredentialsByEmail(this.normalize(query.email));

    if (credentials === null || !(await this.passwordHasher.verify(query.password, credentials.passwordHash))) {
      throw new InvalidCredentials();
    }

    return this.tokenService.issue(credentials.playerId);
  }

  /** The email as it is stored (R1, R7). An email that could never be registered is a wrong email, not a 400. */
  private normalize(rawEmail: string): string {
    try {
      return Email.create(rawEmail).value;
    } catch (error) {
      if (error instanceof InvalidEmail) {
        throw new InvalidCredentials();
      }
      throw error;
    }
  }
}
