import { MikroORM, RequestContext } from '@mikro-orm/postgresql';
import type { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { TestingModuleBuilder } from '@nestjs/testing';
import { SyncSeasonCommand } from '../../src/modules/seasons/application/commands/sync-season/sync-season.command.js';
import { F1DataProvider } from '../../src/modules/seasons/application/ports/f1-data-provider.port.js';
import type { RaceData } from '../../src/modules/seasons/domain/race.entity.js';
import type { GridDriverData } from '../../src/modules/seasons/domain/season-driver.entity.js';
import { FakeF1DataProvider } from '../../src/modules/seasons/infrastructure/in-memory/fake-f1-data-provider.js';

const AUSTRALIA: RaceData = {
  round: 1,
  name: 'Australian Grand Prix',
  circuit: 'Albert Park Grand Prix Circuit',
  locality: 'Melbourne',
  country: 'Australia',
  sprintQualifyingAt: null,
  qualifyingAt: new Date('2026-03-07T05:00:00Z'),
  raceAt: new Date('2026-03-08T04:00:00Z'),
};

const CHINA: RaceData = {
  round: 2,
  name: 'Chinese Grand Prix',
  circuit: 'Shanghai International Circuit',
  locality: 'Shanghai',
  country: 'China',
  sprintQualifyingAt: new Date('2026-03-13T07:30:00Z'),
  qualifyingAt: new Date('2026-03-14T07:00:00Z'),
  raceAt: new Date('2026-03-15T07:00:00Z'),
};

const STARTERS: GridDriverData[] = [
  {
    externalId: 'verstappen',
    code: 'VER',
    number: 3,
    firstName: 'Max',
    lastName: 'Verstappen',
    team: { id: 'red_bull', name: 'Red Bull' },
  },
  {
    externalId: 'norris',
    code: 'NOR',
    number: 1,
    firstName: 'Lando',
    lastName: 'Norris',
    team: { id: 'mclaren', name: 'McLaren' },
  },
  {
    externalId: 'leclerc',
    code: 'LEC',
    number: 16,
    firstName: 'Charles',
    lastName: 'Leclerc',
    team: { id: 'ferrari', name: 'Ferrari' },
  },
];

/** Replaces the Jolpica adapter with a fake, so no e2e test calls the real API (constitution 8). */
const fakeF1Data = new FakeF1DataProvider();

export const withFakeF1Data = (builder: TestingModuleBuilder): TestingModuleBuilder =>
  builder.overrideProvider(F1DataProvider).useValue(fakeF1Data);

/** Syncs 2026 with Australia and China, out of order on purpose, and three starters. */
export async function syncSeason2026(app: INestApplication): Promise<void> {
  fakeF1Data.races = [CHINA, AUSTRALIA];
  fakeF1Data.starters = STARTERS;
  // Outside an HTTP request MikroORM needs its own context, as in the command line
  await RequestContext.create(app.get(MikroORM).em, () => app.get(CommandBus).execute(new SyncSeasonCommand(2026)));
}
