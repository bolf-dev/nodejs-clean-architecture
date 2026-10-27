import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { Nickname } from '../../domain/nickname.value-object.js';
import type { Player } from '../../domain/player.aggregate.js';
import { NicknameAlreadyTaken } from '../../domain/player.errors.js';
import { PlayerRepository } from '../../domain/player.repository.port.js';
import { PlayerMapper } from './player.mapper.js';
import { PlayerRecord } from './player.record.js';

const NICKNAME_INDEX = 'players_nickname_lower_unique';

@Injectable()
export class MikroOrmPlayerRepository implements PlayerRepository {
  constructor(private readonly em: EntityManager) {}

  async existsWithNickname(nickname: Nickname): Promise<boolean> {
    const rows = await this.em
      .getConnection()
      .execute('select 1 from players where lower(nickname) = lower(?) limit 1', [nickname.value]);
    return rows.length > 0;
  }

  async save(player: Player): Promise<void> {
    try {
      await this.em.insert(PlayerRecord, PlayerMapper.toRecord(player));
    } catch (error) {
      // Two requests with the same nickname at the same time: the unique index rejects the second one
      if (error instanceof UniqueConstraintViolationException && error.message.includes(NICKNAME_INDEX)) {
        throw new NicknameAlreadyTaken(player.nickname);
      }
      throw error;
    }
  }
}
