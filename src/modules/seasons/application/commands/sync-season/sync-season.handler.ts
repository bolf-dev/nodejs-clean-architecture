import { randomUUID } from 'node:crypto';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { GridDriverData } from '../../../domain/season-driver.entity.js';
import { Season } from '../../../domain/season.aggregate.js';
import { SeasonRepository } from '../../../domain/season.repository.port.js';
import { F1DataProvider } from '../../ports/f1-data-provider.port.js';
import { SyncSeasonCommand, type SyncSeasonSummary } from './sync-season.command.js';

@CommandHandler(SyncSeasonCommand)
export class SyncSeasonHandler implements ICommandHandler<SyncSeasonCommand> {
  constructor(
    private readonly f1DataProvider: F1DataProvider,
    private readonly seasonRepository: SeasonRepository,
  ) {}

  async execute({ year }: SyncSeasonCommand): Promise<SyncSeasonSummary> {
    // All data is fetched before anything changes, so a failing source changes nothing (R3)
    const races = await this.f1DataProvider.calendar(year);
    const grid = await this.currentGrid(year);

    const season = (await this.seasonRepository.findByYear(year)) ?? Season.create(year);
    const created = races.filter((race) => season.syncRace(race, randomUUID())).length;
    season.replaceGrid(grid, () => randomUUID());
    await this.seasonRepository.save(season);

    return { races: races.length, created, updated: races.length - created, drivers: season.drivers.length };
  }

  /** The starters of the latest race; before the first race, the season's drivers with a code and a number (R7). */
  private async currentGrid(year: number): Promise<GridDriverData[]> {
    const starters = await this.f1DataProvider.latestRaceStarters(year);
    if (starters.length > 0) {
      return starters;
    }
    const drivers = await this.f1DataProvider.seasonDrivers(year);
    return drivers.flatMap(({ code, number, ...driver }) =>
      code !== null && number !== null ? [{ ...driver, code, number, team: null }] : [],
    );
  }
}
