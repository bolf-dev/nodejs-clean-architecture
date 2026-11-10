import { PredictionPicks } from '../../domain/prediction-picks.value-object.js';
import { Prediction } from '../../domain/prediction.aggregate.js';
import type { PredictionRecord } from './prediction.record.js';

/** Converts between the Prediction aggregate and the shape of a row in the predictions table. */
export class PredictionMapper {
  static toRecord(prediction: Prediction): PredictionRecord {
    const { qualifying, race } = prediction.picks;
    return {
      id: prediction.id,
      playerId: prediction.playerId,
      raceId: prediction.raceId,
      qualifyingP1: qualifying.p1,
      qualifyingP2: qualifying.p2,
      qualifyingP3: qualifying.p3,
      raceP1: race.p1,
      raceP2: race.p2,
      raceP3: race.p3,
      submittedAt: prediction.submittedAt,
      updatedAt: prediction.updatedAt,
    };
  }

  static toDomain(record: PredictionRecord): Prediction {
    return Prediction.reconstitute({
      id: record.id,
      playerId: record.playerId,
      raceId: record.raceId,
      picks: PredictionPicks.reconstitute({
        qualifying: { p1: record.qualifyingP1, p2: record.qualifyingP2, p3: record.qualifyingP3 },
        race: { p1: record.raceP1, p2: record.raceP2, p3: record.raceP3 },
      }),
      submittedAt: record.submittedAt,
      updatedAt: record.updatedAt,
    });
  }
}
