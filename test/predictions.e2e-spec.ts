import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { clearDatabase, query } from './support/database.js';
import { registerAndLogIn } from './support/registration.js';
import { syncSeason2026, withFakeF1Data } from './support/season.js';
import { createTestApp } from './support/test-app.js';

const UNKNOWN_RACE = '0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b';
const UNKNOWN_PLAYER = '0199a1b2-8d4e-7f50-9b6c-7d8e9f0a1b2c';

describe('Predictions (e2e)', () => {
  let app: INestApplication<App>;
  let myId: string;
  let authorization: string;
  let australiaId: string;
  let chinaId: string;

  const submit = (raceId: string, body: object) =>
    request(app.getHttpServer())
      .put(`/v1/races/${raceId}/predictions/me`)
      .set('Authorization', authorization)
      .send(body);
  const getMine = (raceId: string) =>
    request(app.getHttpServer()).get(`/v1/races/${raceId}/predictions/me`).set('Authorization', authorization);

  beforeAll(async () => {
    app = await createTestApp(withFakeF1Data);
    await clearDatabase(app);
    ({ id: myId, authorization } = await registerAndLogIn(app, 'JohnDoe'));
    await syncSeason2026(app);
    const [australia, china] = await query<{ id: string }>(app, 'select id from races order by round');
    australiaId = australia!.id;
    chinaId = china!.id;
  });

  beforeEach(async () => {
    await query(app, 'truncate predictions');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PUT /v1/races/{raceId}/predictions/me', () => {
    it('AC1 saves the prediction, the pole driver may be on the podium', async () => {
      await submit(chinaId, { pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' }).expect(204);

      const response = await getMine(chinaId).expect(200);
      expect(response.body).toEqual({
        raceId: chinaId,
        pole: 'NOR',
        p1: 'VER',
        p2: 'NOR',
        p3: 'LEC',
        submittedAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body.submittedAt).toBe(response.body.updatedAt);
    });

    it('AC2 replaces the prediction and keeps submittedAt', async () => {
      await submit(chinaId, { pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' }).expect(204);
      const first = (await getMine(chinaId).expect(200)).body;

      await submit(chinaId, { pole: 'VER', p1: 'LEC', p2: 'VER', p3: 'NOR' }).expect(204);

      const second = (await getMine(chinaId).expect(200)).body;
      expect(second).toMatchObject({ pole: 'VER', p1: 'LEC', p2: 'VER', p3: 'NOR', submittedAt: first.submittedAt });
      expect(new Date(second.updatedAt).getTime()).toBeGreaterThan(new Date(first.updatedAt).getTime());
      expect(await query(app, 'select id from predictions')).toHaveLength(1);
    });

    it('AC3 rejects the same driver twice on the podium', async () => {
      const response = await submit(chinaId, { pole: 'NOR', p1: 'VER', p2: 'VER', p3: 'LEC' }).expect(400);

      expect(response.body).toEqual({ error: 'P1, P2 and P3 must be three different drivers' });
    });

    it('AC4 rejects a driver who is not a driver of the season', async () => {
      const response = await submit(chinaId, { pole: 'XYZ', p1: 'VER', p2: 'NOR', p3: 'LEC' }).expect(400);

      expect(response.body).toEqual({ error: 'Driver "XYZ" is not a driver of the 2026 season' });
    });

    it('AC5 returns 404 for an unknown race', async () => {
      const response = await submit(UNKNOWN_RACE, { pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' }).expect(404);

      expect(response.body).toEqual({ error: `Race "${UNKNOWN_RACE}" not found` });
    });

    it('rejects a missing field', async () => {
      const response = await submit(chinaId, { p1: 'VER', p2: 'NOR', p3: 'LEC' }).expect(400);

      expect(response.body).toEqual({ error: 'pole must be a string' });
    });
  });

  describe('GET /v1/races/{raceId}/predictions/me', () => {
    it('AC6 returns 404 when I have no prediction for the race', async () => {
      const response = await getMine(australiaId).expect(404);

      expect(response.body).toEqual({ error: 'Prediction not found' });
    });
  });

  describe('GET /v1/players/{playerId}/predictions', () => {
    const listOf = (playerId: string, viewerAuthorization = authorization) =>
      request(app.getHttpServer())
        .get(`/v1/players/${playerId}/predictions?season=2026`)
        .set('Authorization', viewerAuthorization);

    it('AC7 returns my predictions ordered by round', async () => {
      await submit(chinaId, { pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' }).expect(204);
      await submit(australiaId, { pole: 'VER', p1: 'VER', p2: 'LEC', p3: 'NOR' }).expect(204);

      const response = await listOf(myId).expect(200);

      expect(response.body.predictions.map(({ round }: { round: number }) => round)).toEqual([1, 2]);
      expect(response.body.predictions[1]).toEqual({
        raceId: chinaId,
        round: 2,
        raceName: 'Chinese Grand Prix',
        pole: 'NOR',
        p1: 'VER',
        p2: 'NOR',
        p3: 'LEC',
        submittedAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('AC8 returns no predictions of another player before races are finished', async () => {
      await submit(chinaId, { pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' }).expect(204);
      const other = await registerAndLogIn(app, 'JaneRoe');

      const response = await listOf(myId, other.authorization).expect(200);

      expect(response.body).toEqual({ predictions: [] });
    });

    it('AC8 returns 404 for an unknown player', async () => {
      const response = await listOf(UNKNOWN_PLAYER).expect(404);

      expect(response.body).toEqual({ error: `Player "${UNKNOWN_PLAYER}" not found` });
    });
  });
});
