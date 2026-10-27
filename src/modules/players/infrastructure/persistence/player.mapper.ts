import type { Player } from '../../domain/player.aggregate.js';
import type { PlayerRecord } from './player.record.js';

/** Converts the Player aggregate to the shape of a row in the players table. */
export class PlayerMapper {
  static toRecord(player: Player): PlayerRecord {
    return {
      id: player.id,
      nickname: player.nickname.value,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    };
  }
}
