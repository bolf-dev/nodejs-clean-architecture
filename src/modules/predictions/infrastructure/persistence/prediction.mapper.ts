import { PredictionPicks } from '../../domain/prediction-picks.value-object.js';
import { Prediction } from '../../domain/prediction.aggregate.js';
import type { PredictionRecord } from './prediction.record.js';

/** Converts between the Prediction aggregate and the shape of a row in the predictions table. */
export class PredictionMapper {
  static toRecord(prediction: Prediction): PredictionRecord {
    return {
      id: prediction.id,
      playerId: prediction.playerId,
      raceId: prediction.raceId,
      pole: prediction.picks.pole,
      p1: prediction.picks.p1,
      p2: prediction.picks.p2,
      p3: prediction.picks.p3,
      submittedAt: prediction.submittedAt,
      updatedAt: prediction.updatedAt,
    };
  }

  static toDomain(record: PredictionRecord): Prediction {
    return Prediction.reconstitute({
      id: record.id,
      playerId: record.playerId,
      raceId: record.raceId,
      picks: PredictionPicks.reconstitute(record),
      submittedAt: record.submittedAt,
      updatedAt: record.updatedAt,
    });
  }
}
