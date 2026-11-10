import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { PredictionReadModel } from '../../application/prediction.read-model.js';
import { PredictionQueries } from '../../application/ports/prediction-queries.port.js';

/** A row as plain SQL returns it. MikroORM returns timestamps of raw queries as strings. */
interface PredictionRow {
  race_id: string;
  pole: string;
  p1: string;
  p2: string;
  p3: string;
  submitted_at: string;
  updated_at: string;
}

/** Read side of predictions: plain SQL on the module's own table, straight into the read model. */
@Injectable()
export class SqlPredictionQueries implements PredictionQueries {
  constructor(private readonly em: EntityManager) {}

  async findMine(playerId: string, raceId: string): Promise<PredictionReadModel | null> {
    const [row] = await this.em
      .getConnection()
      .execute<PredictionRow[]>(
        'select race_id, pole, p1, p2, p3, submitted_at, updated_at from predictions where player_id = ? and race_id = ?',
        [playerId, raceId],
      );
    return row === undefined ? null : toPrediction(row);
  }

  async listByPlayer(playerId: string, raceIds: string[]): Promise<PredictionReadModel[]> {
    if (raceIds.length === 0) {
      return [];
    }
    const rows = await this.em
      .getConnection()
      .execute<PredictionRow[]>(
        `select race_id, pole, p1, p2, p3, submitted_at, updated_at from predictions where player_id = ? and race_id in (${raceIds.map(() => '?').join(', ')})`,
        [playerId, ...raceIds],
      );
    return rows.map(toPrediction);
  }
}

function toPrediction(row: PredictionRow): PredictionReadModel {
  return {
    raceId: row.race_id,
    pole: row.pole,
    p1: row.p1,
    p2: row.p2,
    p3: row.p3,
    submittedAt: new Date(row.submitted_at),
    updatedAt: new Date(row.updated_at),
  };
}
