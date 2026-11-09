import { PlayerQueries } from '../../application/ports/player-queries.port.js';
import type { PlayerCredentials, PlayerReadModel } from '../../application/player.read-model.js';

/** PlayerQueries adapter keeping read models in memory, used by unit tests instead of the database. */
export class InMemoryPlayerQueries implements PlayerQueries {
  readonly players: PlayerReadModel[] = [];
  readonly credentials: (PlayerCredentials & { email: string })[] = [];

  async findById(id: string): Promise<PlayerReadModel | null> {
    return this.players.find((player) => player.id === id) ?? null;
  }

  async findCredentialsByEmail(email: string): Promise<PlayerCredentials | null> {
    const found = this.credentials.find((credentials) => credentials.email === email);
    return found === undefined ? null : { playerId: found.playerId, passwordHash: found.passwordHash };
  }
}
