import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { Email } from '../../domain/email.value-object.js';
import type { Nickname } from '../../domain/nickname.value-object.js';
import type { Player } from '../../domain/player.aggregate.js';
import { EmailAlreadyRegistered, NicknameAlreadyTaken } from '../../domain/player.errors.js';
import { PlayerRepository } from '../../domain/player.repository.port.js';
import { PlayerMapper } from './player.mapper.js';
import { PlayerRecord } from './player.record.js';

const NICKNAME_INDEX = 'players_nickname_lower_unique';
const EMAIL_INDEX = 'players_email_unique';

@Injectable()
export class MikroOrmPlayerRepository implements PlayerRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Player | null> {
    const record = await this.em.findOne(PlayerRecord, { id });
    return record === null ? null : PlayerMapper.toDomain(record);
  }

  async existsWithNickname(nickname: Nickname, exceptPlayerId?: string): Promise<boolean> {
    const rows = exceptPlayerId
      ? await this.em
          .getConnection()
          .execute('select 1 from players where lower(nickname) = lower(?) and id <> ? limit 1', [
            nickname.value,
            exceptPlayerId,
          ])
      : await this.em
          .getConnection()
          .execute('select 1 from players where lower(nickname) = lower(?) limit 1', [nickname.value]);
    return rows.length > 0;
  }

  async existsWithEmail(email: Email): Promise<boolean> {
    const rows = await this.em
      .getConnection()
      .execute('select 1 from players where email = ? limit 1', [email.value]);
    return rows.length > 0;
  }

  async save(player: Player): Promise<void> {
    try {
      await this.em.upsert(PlayerRecord, PlayerMapper.toRecord(player));
    } catch (error) {
      // Two requests with the same nickname or email at the same time: the unique index rejects the second one
      if (error instanceof UniqueConstraintViolationException) {
        if (error.message.includes(NICKNAME_INDEX)) {
          throw new NicknameAlreadyTaken(player.nickname);
        }
        if (error.message.includes(EMAIL_INDEX)) {
          throw new EmailAlreadyRegistered(player.email);
        }
      }
      throw error;
    }
  }
}
