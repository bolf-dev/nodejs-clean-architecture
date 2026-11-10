import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PlayerQueries } from '../../application/ports/player-queries.port.js';
import type { PlayerCredentials, PlayerListItem, PlayerReadModel } from '../../application/player.read-model.js';

/** A row as plain SQL returns it. MikroORM returns timestamps of raw queries as strings. */
interface PlayerRow {
  id: string;
  email: string;
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
      .execute<PlayerRow[]>('select id, email, nickname, created_at, updated_at from players where id = ?', [id]);

    if (row === undefined) {
      return null;
    }
    return {
      id: row.id,
      email: row.email,
      nickname: row.nickname,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async listAll(): Promise<PlayerListItem[]> {
    return this.em
      .getConnection()
      .execute<PlayerListItem[]>('select id, nickname from players order by lower(nickname), id');
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
