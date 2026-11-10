import type { RaceData } from '../../../domain/race.entity.js';
import type { GridDriverData } from '../../../domain/season-driver.entity.js';
import { FakeF1DataProvider } from '../../../infrastructure/in-memory/fake-f1-data-provider.js';
import { InMemorySeasonRepository } from '../../../infrastructure/in-memory/in-memory-season.repository.js';
import { F1DataUnavailable } from '../../season.errors.js';
import { SyncSeasonCommand } from './sync-season.command.js';
import { SyncSeasonHandler } from './sync-season.handler.js';

const race = (round: number): RaceData => ({
  round,
  name: `Grand Prix ${round}`,
  circuit: 'Circuit',
  locality: 'Locality',
  country: 'Country',
  sprintQualifyingAt: null,
  qualifyingAt: new Date('2026-03-07T05:00:00.000Z'),
  raceAt: new Date('2026-03-08T04:00:00.000Z'),
});

const starter = (externalId: string, code: string): GridDriverData => ({
  externalId,
  code,
  number: 1,
  firstName: 'John',
  lastName: 'Doe',
  team: { id: 'mclaren', name: 'McLaren' },
});

describe('SyncSeasonHandler', () => {
  let provider: FakeF1DataProvider;
  let repository: InMemorySeasonRepository;
  let handler: SyncSeasonHandler;

  const sync = () => handler.execute(new SyncSeasonCommand(2026));

  beforeEach(() => {
    provider = new FakeF1DataProvider();
    repository = new InMemorySeasonRepository();
    handler = new SyncSeasonHandler(provider, repository);
    provider.races = [race(1), race(2)];
    provider.starters = [starter('john_doe', 'DOE'), starter('jane_roe', 'ROE')];
  });

  it('updates a changed qualifying time without duplicating races (AC2)', async () => {
    expect(await sync()).toEqual({ races: 2, created: 2, updated: 0, drivers: 2 });

    const newQualifyingAt = new Date('2026-03-07T06:00:00.000Z');
    provider.races = [{ ...race(1), qualifyingAt: newQualifyingAt }, race(2)];

    expect(await sync()).toEqual({ races: 2, created: 0, updated: 2, drivers: 2 });
    const season = await repository.findByYear(2026);
    expect(season?.races).toHaveLength(2);
    expect(season?.races[0]?.qualifyingAt).toEqual(newQualifyingAt);
  });

  it('takes the drivers with a code and a number, without teams, before the first race (AC4)', async () => {
    provider.starters = [];
    provider.drivers = [
      { externalId: 'john_doe', code: 'DOE', number: 7, firstName: 'John', lastName: 'Doe' },
      { externalId: 'reserve', code: null, number: null, firstName: 'Jane', lastName: 'Roe' },
    ];

    await sync();

    const season = await repository.findByYear(2026);
    expect(season?.drivers.map(({ externalId, team }) => [externalId, team])).toEqual([['john_doe', null]]);
  });

  it('removes a driver who is not in the latest race (AC5)', async () => {
    await sync();
    provider.starters = [starter('john_doe', 'DOE')];

    await sync();

    const season = await repository.findByYear(2026);
    expect(season?.drivers.map(({ externalId }) => externalId)).toEqual(['john_doe']);
  });

  // Nothing changes because all data is fetched before the season is touched, and saved in one transaction
  it('fails when the data source cannot be reached (AC6)', async () => {
    provider.unavailable = true;

    await expect(sync()).rejects.toThrow(F1DataUnavailable);
  });
});
