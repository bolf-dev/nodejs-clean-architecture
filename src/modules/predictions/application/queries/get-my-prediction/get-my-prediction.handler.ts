import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PredictionNotFound } from '../../prediction.errors.js';
import type { PredictionReadModel } from '../../prediction.read-model.js';
import { PredictionQueries } from '../../ports/prediction-queries.port.js';
import { GetMyPredictionQuery } from './get-my-prediction.query.js';

@QueryHandler(GetMyPredictionQuery)
export class GetMyPredictionHandler implements IQueryHandler<GetMyPredictionQuery> {
  constructor(private readonly predictionQueries: PredictionQueries) {}

  async execute(query: GetMyPredictionQuery): Promise<PredictionReadModel> {
    const prediction = await this.predictionQueries.findMine(query.playerId, query.raceId);
    if (prediction === null) {
      throw new PredictionNotFound();
    }
    return prediction;
  }
}
