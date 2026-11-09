import { Email } from '../../domain/email.value-object.js';
import { Nickname } from '../../domain/nickname.value-object.js';
import { Player } from '../../domain/player.aggregate.js';
import type { PlayerRecord } from './player.record.js';

/** Converts between the Player aggregate and the shape of a row in the players table. */
export class PlayerMapper {
  static toRecord(player: Player): PlayerRecord {
    return {
      id: player.id,
      email: player.email.value,
      nickname: player.nickname.value,
      passwordHash: player.passwordHash,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    };
  }

  static toDomain(record: PlayerRecord): Player {
    return Player.reconstitute({
      id: record.id,
      email: Email.create(record.email),
      nickname: Nickname.create(record.nickname),
      passwordHash: record.passwordHash,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
