import type { Nickname } from '../../domain/nickname.value-object.js';
import type { Player } from '../../domain/player.aggregate.js';
import { NicknameAlreadyTaken } from '../../domain/player.errors.js';
import { PlayerRepository } from '../../domain/player.repository.port.js';

/** PlayerRepository adapter keeping players in memory, used by unit tests instead of the database. */
export class InMemoryPlayerRepository implements PlayerRepository {
  readonly players: Player[] = [];

  async existsWithNickname(nickname: Nickname): Promise<boolean> {
    const wanted = nickname.value.toLowerCase();
    return this.players.some((player) => player.nickname.value.toLowerCase() === wanted);
  }

  async save(player: Player): Promise<void> {
    // Same guarantee as the unique index in the database
    if (await this.existsWithNickname(player.nickname)) {
      throw new NicknameAlreadyTaken(player.nickname);
    }
    this.players.push(player);
  }
}
