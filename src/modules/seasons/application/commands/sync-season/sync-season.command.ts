import { Command } from '@nestjs/cqrs';

/** What a sync did, printed by the command line (R4). */
export interface SyncSeasonSummary {
  races: number;
  created: number;
  updated: number;
  drivers: number;
}

/** Load or update the races and the current grid of a season from the F1 data source (R1, R2). */
export class SyncSeasonCommand extends Command<SyncSeasonSummary> {
  constructor(readonly year: number) {
    super();
  }
}
