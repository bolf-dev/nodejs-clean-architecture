import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { clearDatabase } from './support/database.js';
import { registerAndLogIn } from './support/registration.js';
import { syncSeason2026, withFakeF1Data } from './support/season.js';
import { createTestApp } from './support/test-app.js';

describe('Seasons (e2e)', () => {
  let app: INestApplication<App>;
  let authorization: string;

  const get = (path: string) => request(app.getHttpServer()).get(path).set('Authorization', authorization);

  beforeAll(async () => {
    app = await createTestApp(withFakeF1Data);
    await clearDatabase(app);
    ({ authorization } = await registerAndLogIn(app, 'JohnDoe'));
    await syncSeason2026(app);
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

      expect(response.body.drivers.map(({ code }: { code: string }) => code)).toEqual(['LEC', 'NOR', 'VER']);
      expect(response.body.drivers[1]).toEqual({
        id: expect.any(String),
        code: 'NOR',
        number: 1,
        firstName: 'Lando',
        lastName: 'Norris',
        team: { id: 'mclaren', name: 'McLaren' },
      });
    });
  });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/v1/races?season=2026').expect(401);
  });
});
