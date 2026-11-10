import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { Prediction } from '../../domain/prediction.aggregate.js';
import { PredictionRepository } from '../../domain/prediction.repository.port.js';
import { PredictionMapper } from './prediction.mapper.js';
import { PredictionRecord } from './prediction.record.js';

@Injectable()
export class MikroOrmPredictionRepository implements PredictionRepository {
  constructor(private readonly em: EntityManager) {}

  async findByPlayerAndRace(playerId: string, raceId: string): Promise<Prediction | null> {
    const record = await this.em.findOne(PredictionRecord, { playerId, raceId });
    return record === null ? null : PredictionMapper.toDomain(record);
  }

  async save(prediction: Prediction): Promise<void> {
    // Upsert on the player and the race, so two first submissions at the same time (e.g. a double click)
    // end in one prediction instead of failing on the unique index. The first id and submission time are kept.
    await this.em.upsert(PredictionRecord, PredictionMapper.toRecord(prediction), {
      onConflictFields: ['playerId', 'raceId'],
      onConflictExcludeFields: ['id', 'submittedAt'],
    });
  }
}
