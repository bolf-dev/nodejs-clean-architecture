import { randomUUID } from 'node:crypto';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PredictionPicks } from '../../../domain/prediction-picks.value-object.js';
import { Prediction } from '../../../domain/prediction.aggregate.js';
import { PredictionRepository } from '../../../domain/prediction.repository.port.js';
import { RaceNotFound } from '../../prediction.errors.js';
import { RaceCatalog } from '../../ports/race-catalog.port.js';
import { SubmitPredictionCommand } from './submit-prediction.command.js';

@CommandHandler(SubmitPredictionCommand)
export class SubmitPredictionHandler implements ICommandHandler<SubmitPredictionCommand> {
  constructor(
    private readonly raceCatalog: RaceCatalog,
    private readonly predictionRepository: PredictionRepository,
  ) {}

  async execute(command: SubmitPredictionCommand): Promise<void> {
    const season = await this.raceCatalog.seasonOf(command.raceId);
    if (season === null) {
      throw new RaceNotFound(command.raceId);
    }

    const { pole, p1, p2, p3 } = command;
    const picks = PredictionPicks.create(
      { pole, p1, p2, p3 },
      { season, driverCodes: await this.raceCatalog.driverCodes(season) },
    );

    // Until the deadline (010) a prediction can be changed at any time (R6)
    const now = new Date();
    const existing = await this.predictionRepository.findByPlayerAndRace(command.playerId, command.raceId);
    if (existing) {
      existing.change(picks, now);
      await this.predictionRepository.save(existing);
    } else {
      await this.predictionRepository.save(
        Prediction.submit({ id: randomUUID(), playerId: command.playerId, raceId: command.raceId, picks, now }),
      );
    }
  }
}
