import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { PredictionReadModel } from '../../application/prediction.read-model.js';
import { PredictionQueries } from '../../application/ports/prediction-queries.port.js';

/** A row as plain SQL returns it. MikroORM returns timestamps of raw queries as strings. */
interface PredictionRow {
  race_id: string;
  qualifying_p1: string;
  qualifying_p2: string;
  qualifying_p3: string;
  race_p1: string;
  race_p2: string;
  race_p3: string;
  submitted_at: string;
  updated_at: string;
}

const COLUMNS =
  'race_id, qualifying_p1, qualifying_p2, qualifying_p3, race_p1, race_p2, race_p3, submitted_at, updated_at';

/** Read side of predictions: plain SQL on the module's own table, straight into the read model. */
@Injectable()
export class SqlPredictionQueries implements PredictionQueries {
  constructor(private readonly em: EntityManager) {}

  async findMine(playerId: string, raceId: string): Promise<PredictionReadModel | null> {
    const [row] = await this.em
      .getConnection()
      .execute<PredictionRow[]>(
        `select ${COLUMNS} from predictions where player_id = ? and race_id = ?`,
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
        `select ${COLUMNS} from predictions where player_id = ? and race_id in (${raceIds.map(() => '?').join(', ')})`,
        [playerId, ...raceIds],
      );
    return rows.map(toPrediction);
  }
}

function toPrediction(row: PredictionRow): PredictionReadModel {
  return {
    raceId: row.race_id,
    qualifying: { p1: row.qualifying_p1, p2: row.qualifying_p2, p3: row.qualifying_p3 },
    race: { p1: row.race_p1, p2: row.race_p2, p3: row.race_p3 },
    submittedAt: new Date(row.submitted_at),
    updatedAt: new Date(row.updated_at),
  };
}
