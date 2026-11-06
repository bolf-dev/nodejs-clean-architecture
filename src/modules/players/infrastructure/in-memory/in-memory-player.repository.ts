import type { Email } from '../../domain/email.value-object.js';
import type { Nickname } from '../../domain/nickname.value-object.js';
import type { Player } from '../../domain/player.aggregate.js';
import { EmailAlreadyRegistered, NicknameAlreadyTaken } from '../../domain/player.errors.js';
import { PlayerRepository } from '../../domain/player.repository.port.js';

/** PlayerRepository adapter keeping players in memory, used by unit tests instead of the database. */
export class InMemoryPlayerRepository implements PlayerRepository {
  readonly players: Player[] = [];

  async findById(id: string): Promise<Player | null> {
    return this.players.find((player) => player.id === id) ?? null;
  }

  async existsWithNickname(nickname: Nickname, exceptPlayerId?: string): Promise<boolean> {
    const wanted = nickname.value.toLowerCase();
    return this.players.some(
      (player) => player.id !== exceptPlayerId && player.nickname.value.toLowerCase() === wanted,
    );
  }

  async existsWithEmail(email: Email): Promise<boolean> {
    return this.players.some((player) => player.email.value === email.value);
  }

  async save(player: Player): Promise<void> {
    // Same guarantees as the unique indexes in the database
    if (await this.existsWithNickname(player.nickname, player.id)) {
      throw new NicknameAlreadyTaken(player.nickname);
    }
    if (this.players.some(({ id, email }) => id !== player.id && email.value === player.email.value)) {
      throw new EmailAlreadyRegistered(player.email);
    }
    const index = this.players.findIndex(({ id }) => id === player.id);
    if (index === -1) {
      this.players.push(player);
    } else {
      this.players[index] = player;
    }
  }
}
