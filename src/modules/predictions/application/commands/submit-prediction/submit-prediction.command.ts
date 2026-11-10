import { Command } from '@nestjs/cqrs';

/** Submit or replace the player's prediction for the race. The codes are raw input, the domain checks them. */
export class SubmitPredictionCommand extends Command<void> {
  constructor(
    readonly playerId: string,
    readonly raceId: string,
    readonly pole: string,
    readonly p1: string,
    readonly p2: string,
    readonly p3: string,
  ) {
    super();
  }
}
