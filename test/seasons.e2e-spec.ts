import { MikroORM, RequestContext } from '@mikro-orm/postgresql';
import type { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SyncSeasonCommand } from '../src/modules/seasons/application/commands/sync-season/sync-season.command.js';
import { F1DataProvider } from '../src/modules/seasons/application/ports/f1-data-provider.port.js';
import type { RaceData } from '../src/modules/seasons/domain/race.entity.js';
import { FakeF1DataProvider } from '../src/modules/seasons/infrastructure/in-memory/fake-f1-data-provider.js';
import { clearDatabase } from './support/database.js';
import { registerAndLogIn } from './support/registration.js';
import { createTestApp } from './support/test-app.js';

const australia: RaceData = {
  round: 1,
  name: 'Australian Grand Prix',
  circuit: 'Albert Park Grand Prix Circuit',
  locality: 'Melbourne',
  country: 'Australia',
  sprintQualifyingAt: null,
  qualifyingAt: new Date('2026-03-07T05:00:00Z'),
  raceAt: new Date('2026-03-08T04:00:00Z'),
};

const china: RaceData = {
  round: 2,
  name: 'Chinese Grand Prix',
  circuit: 'Shanghai International Circuit',
  locality: 'Shanghai',
  country: 'China',
  sprintQualifyingAt: new Date('2026-03-13T07:30:00Z'),
  qualifyingAt: new Date('2026-03-14T07:00:00Z'),
  raceAt: new Date('2026-03-15T07:00:00Z'),
};

describe('Seasons (e2e)', () => {
  let app: INestApplication<App>;
  let authorization: string;
  const provider = new FakeF1DataProvider();

  const get = (path: string) => request(app.getHttpServer()).get(path).set('Authorization', authorization);

  beforeAll(async () => {
    // No test calls the real Jolpica F1 API (constitution 8)
    app = await createTestApp((builder) => builder.overrideProvider(F1DataProvider).useValue(provider));
    await clearDatabase(app);
    ({ authorization } = await registerAndLogIn(app, 'JohnDoe'));

    // Out of order on purpose, the API orders them
    provider.races = [china, australia];
    provider.starters = [
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
    ];
    // Outside an HTTP request MikroORM needs its own context, as in the command line
    await RequestContext.create(app.get(MikroORM).em, () =>
      app.get(CommandBus).execute(new SyncSeasonCommand(2026)),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/races', () => {
    it('AC7 returns the races of the season ordered by round', async () => {
      const response = await get('/v1/races?season=2026').expect(200);

      expect(response.body.races.map(({ round }: { round: number }) => round)).toEqual([1, 2]);
      expect(response.body.races[1]).toEqual({
        id: expect.any(String),
        season: 2026,
        round: 2,
        name: 'Chinese Grand Prix',
        circuit: 'Shanghai International Circuit',
        locality: 'Shanghai',
        country: 'China',
        sprintQualifyingAt: '2026-03-13T07:30:00.000Z',
        qualifyingAt: '2026-03-14T07:00:00.000Z',
        raceAt: '2026-03-15T07:00:00.000Z',
      });
    });

    it.each(['/v1/races?season=abc', '/v1/races'])('AC7 rejects %s', async (path) => {
      const response = await get(path).expect(400);

      expect(response.body).toEqual({ error: 'season must be a year' });
    });

    it('AC7 returns an empty list for a season never synced', async () => {
      const response = await get('/v1/races?season=2025').expect(200);

      expect(response.body).toEqual({ races: [] });
    });
  });

  describe('GET /v1/races/{raceId}', () => {
    it('AC8 returns the race', async () => {
      const [first] = (await get('/v1/races?season=2026').expect(200)).body.races;

      const response = await get(`/v1/races/${first.id}`).expect(200);

      expect(response.body).toEqual(first);
    });

    it('AC8 returns 404 for an unknown id', async () => {
      const unknown = '0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b';

      const response = await get(`/v1/races/${unknown}`).expect(404);

      expect(response.body).toEqual({ error: `Race "${unknown}" not found` });
    });

    it('returns 400 for an id that is not a UUID', async () => {
      const response = await get('/v1/races/abc').expect(400);

      expect(response.body).toEqual({ error: 'raceId must be a UUID' });
    });
  });

  describe('GET /v1/drivers', () => {
    it('AC9 returns the grid ordered by code, with teams', async () => {
      const response = await get('/v1/drivers?season=2026').expect(200);

      expect(response.body).toEqual({
        drivers: [
          {
            id: expect.any(String),
            code: 'NOR',
            number: 1,
            firstName: 'Lando',
            lastName: 'Norris',
            team: { id: 'mclaren', name: 'McLaren' },
          },
          {
            id: expect.any(String),
            code: 'VER',
            number: 3,
            firstName: 'Max',
            lastName: 'Verstappen',
            team: { id: 'red_bull', name: 'Red Bull' },
          },
        ],
      });
    });
  });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/v1/races?season=2026').expect(401);
  });
});
