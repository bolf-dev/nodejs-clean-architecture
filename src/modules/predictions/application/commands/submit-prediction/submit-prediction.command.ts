import { Command } from '@nestjs/cqrs';
import type { Podium } from '../../../domain/prediction-picks.value-object.js';

/** Submit or replace the player's prediction for the race. The codes are raw input, the domain checks them. */
export class SubmitPredictionCommand extends Command<void> {
  constructor(
    readonly playerId: string,
    readonly raceId: string,
    /** P1 is the pole position */
    readonly qualifying: Podium,
    readonly race: Podium,
  ) {
    super();
  }
}
