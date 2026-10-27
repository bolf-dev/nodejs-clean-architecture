import { PlayerQueries } from '../../application/ports/player-queries.port.js';
import type { PlayerReadModel } from '../../application/player.read-model.js';

/** PlayerQueries adapter keeping read models in memory, used by unit tests instead of the database. */
export class InMemoryPlayerQueries implements PlayerQueries {
  readonly players: PlayerReadModel[] = [];

  async findById(id: string): Promise<PlayerReadModel | null> {
    return this.players.find((player) => player.id === id) ?? null;
  }
}
