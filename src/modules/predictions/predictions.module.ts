import { Module } from '@nestjs/common';
import { PredictionRepository } from './domain/prediction.repository.port.js';
import { MikroOrmPredictionRepository } from './infrastructure/persistence/mikro-orm-prediction.repository.js';

@Module({
  providers: [
    // Whoever asks for a port gets its implementation
    { provide: PredictionRepository, useClass: MikroOrmPredictionRepository },
  ],
})
export class PredictionsModule {}
