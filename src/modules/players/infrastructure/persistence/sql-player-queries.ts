import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PlayerQueries } from '../../application/ports/player-queries.port.js';
import type { PlayerCredentials, PlayerReadModel } from '../../application/player.read-model.js';

/** A row as plain SQL returns it. MikroORM returns timestamps of raw queries as strings. */
interface PlayerRow {
  id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
}

/** Read side of players: plain SQL straight into the read model, without the Player aggregate. */
@Injectable()
export class SqlPlayerQueries implements PlayerQueries {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<PlayerReadModel | null> {
    const [row] = await this.em
      .getConnection()
      .execute<PlayerRow[]>('select id, nickname, created_at, updated_at from players where id = ?', [id]);

    if (row === undefined) {
      return null;
    }
    return {
      id: row.id,
      nickname: row.nickname,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findCredentialsByEmail(email: string): Promise<PlayerCredentials | null> {
    const [row] = await this.em
      .getConnection()
      .execute<{ id: string; password_hash: string }[]>(
        'select id, password_hash from players where email = ?',
        [email],
      );

    return row === undefined ? null : { playerId: row.id, passwordHash: row.password_hash };
  }
}
