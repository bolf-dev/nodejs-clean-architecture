import { Module } from '@nestjs/common';
import { SubmitPredictionHandler } from './application/commands/submit-prediction/submit-prediction.handler.js';
import { PlayerDirectory } from './application/ports/player-directory.port.js';
import { PredictionQueries } from './application/ports/prediction-queries.port.js';
import { RaceCatalog } from './application/ports/race-catalog.port.js';
import { GetMyPredictionHandler } from './application/queries/get-my-prediction/get-my-prediction.handler.js';
import { ListPlayerPredictionsHandler } from './application/queries/list-player-predictions/list-player-predictions.handler.js';
import { PredictionRepository } from './domain/prediction.repository.port.js';
import { QueryBusPlayerDirectory } from './infrastructure/cqrs/query-bus-player-directory.js';
import { QueryBusRaceCatalog } from './infrastructure/cqrs/query-bus-race-catalog.js';
import { MikroOrmPredictionRepository } from './infrastructure/persistence/mikro-orm-prediction.repository.js';
import { SqlPredictionQueries } from './infrastructure/persistence/sql-prediction-queries.js';
import { PlayerPredictionsController } from './presentation/http/player-predictions.controller.js';
import { RacePredictionsController } from './presentation/http/race-predictions.controller.js';

@Module({
  controllers: [RacePredictionsController, PlayerPredictionsController],
  providers: [
    SubmitPredictionHandler,
    GetMyPredictionHandler,
    ListPlayerPredictionsHandler,
    // Whoever asks for a port gets its implementation
    { provide: PredictionRepository, useClass: MikroOrmPredictionRepository },
    { provide: PredictionQueries, useClass: SqlPredictionQueries },
    { provide: RaceCatalog, useClass: QueryBusRaceCatalog },
    { provide: PlayerDirectory, useClass: QueryBusPlayerDirectory },
  ],
})
export class PredictionsModule {}
