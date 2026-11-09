import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PlayerRepository } from '../src/modules/players/domain/player.repository.port.js';
import { clearDatabase, query } from './support/database.js';
import { registerAndLogIn, registration } from './support/registration.js';
import { createTestApp } from './support/test-app.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface PlayerRow {
  id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
}

describe('Players (e2e)', () => {
  let app: INestApplication<App>;

  const createPlayer = (body: object) => request(app.getHttpServer()).post('/v1/players').send(body);
  const getPlayer = (path: string, authorization: string) =>
    request(app.getHttpServer()).get(path).set('Authorization', authorization);
  // Since 004 a player changes only their own nickname, through /v1/players/me
  const changeNickname = (authorization: string, body: object) =>
    request(app.getHttpServer()).patch('/v1/players/me').set('Authorization', authorization).send(body);
  const nicknameOf = async (id: string, authorization: string) =>
    (await getPlayer(`/v1/players/${id}`, authorization).expect(200)).body.nickname;
  const storedPlayers = () => query<PlayerRow>(app, 'select * from players order by created_at');

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/players', () => {
    it('AC1 creates a player and returns its id and location', async () => {
      const response = await createPlayer(registration('JohnDoe')).expect(201);

      expect(response.body).toEqual({ id: expect.stringMatching(UUID) });
      expect(response.headers.location).toBe(`/v1/players/${response.body.id}`);

      const viewer = await registerAndLogIn(app, 'Viewer');
      const player = await getPlayer(response.headers.location as string, viewer.authorization).expect(200);
      expect(player.body).toMatchObject({ id: response.body.id, nickname: 'JohnDoe' });
      expect(player.body.createdAt).toBe(player.body.updatedAt);
    });

    it('AC2 stores the nickname without leading and trailing whitespace', async () => {
      await createPlayer(registration('  JohnDoe  ')).expect(201);

      const [player] = await storedPlayers();
      expect(player?.nickname).toBe('JohnDoe');
    });

    it.each(['ab', 'a'.repeat(21)])('AC3 rejects "%s", which is not 3 to 20 characters long', async (nickname) => {
      const response = await createPlayer(registration(nickname)).expect(400);

      expect(response.body).toEqual({ error: 'Nickname must be 3 to 20 characters long' });
      expect(await storedPlayers()).toHaveLength(0);
    });

    it.each(['abc', 'a'.repeat(20)])('AC3 accepts "%s", which is 3 to 20 characters long', async (nickname) => {
      await createPlayer(registration(nickname)).expect(201);
    });

    it.each(['john!', 'john doe', 'jöhn'])('AC4 rejects "%s" with characters that are not allowed', async (nickname) => {
      const response = await createPlayer(registration(nickname)).expect(400);

      expect(response.body).toEqual({ error: 'Nickname may contain only letters, digits, "-" and "_"' });
    });

    it.each(['john_97', 'john-doe'])('AC4 accepts "%s"', async (nickname) => {
      await createPlayer(registration(nickname)).expect(201);
    });

    it.each(['johndoe', 'JOHNDOE'])('AC5 rejects "%s" when "JohnDoe" exists', async (nickname) => {
      await createPlayer(registration('JohnDoe')).expect(201);

      const response = await createPlayer(registration(nickname)).expect(409);

      expect(response.body).toEqual({ error: `Nickname "${nickname}" is already taken` });
      expect(await storedPlayers()).toHaveLength(1);
    });

    it('AC6 accepts only one of two concurrent requests with the same nickname', async () => {
      const responses = await Promise.all([
        createPlayer(registration('JohnDoe')),
        createPlayer(registration('JohnDoe')),
      ]);

      expect(responses.map(({ status }) => status).sort((a, b) => a - b)).toEqual([201, 409]);
      expect(await storedPlayers()).toHaveLength(1);
    });

    it.each([{ nickname: undefined }, { nickname: 123 }])('AC7 rejects the nickname %j', async (body) => {
      const response = await createPlayer(registration('JohnDoe', body)).expect(400);

      expect(response.body).toEqual({ error: 'nickname must be a string' });
    });
  });

  describe('GET /v1/players (005)', () => {
    it('AC1 lists every player with id and nickname, ordered by nickname ignoring letter case', async () => {
      const { authorization } = await registerAndLogIn(app, 'johndoe');
      await registerAndLogIn(app, 'Ferrari_Fan');
      await registerAndLogIn(app, 'Alonso_Fan');

      const response = await request(app.getHttpServer()).get('/v1/players').set('Authorization', authorization).expect(200);

      expect(response.body.players.map(({ nickname }: { nickname: string }) => nickname)).toEqual([
        'Alonso_Fan',
        'Ferrari_Fan',
        'johndoe',
      ]);
      expect(Object.keys(response.body.players[0]).sort()).toEqual(['id', 'nickname']);
    });

    it('AC2 needs a token', async () => {
      await request(app.getHttpServer()).get('/v1/players').expect(401);
    });
  });

  describe('GET /v1/players/{playerId}', () => {
    it('AC8 returns the player', async () => {
      const { id, authorization } = await registerAndLogIn(app, 'JohnDoe');
      const [stored] = await storedPlayers();

      const response = await getPlayer(`/v1/players/${id}`, authorization).expect(200);

      expect(response.body).toEqual({
        id,
        nickname: 'JohnDoe',
        createdAt: new Date(stored!.created_at).toISOString(),
        updatedAt: new Date(stored!.updated_at).toISOString(),
      });
    });

    it('AC9 returns 404 for an unknown id', async () => {
      const { authorization } = await registerAndLogIn(app, 'JohnDoe');
      const id = '0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b';

      const response = await getPlayer(`/v1/players/${id}`, authorization).expect(404);

      expect(response.body).toEqual({ error: `Player "${id}" not found` });
    });

    it('AC10 returns 400 when the id is not a UUID', async () => {
      const { authorization } = await registerAndLogIn(app, 'JohnDoe');

      const response = await getPlayer('/v1/players/123', authorization).expect(400);

      expect(response.body).toEqual({ error: 'playerId must be a UUID' });
    });
  });

  describe('PATCH /v1/players/me', () => {
    it('AC11 changes the nickname and updatedAt, createdAt stays', async () => {
      const { id, authorization } = await registerAndLogIn(app, 'JohnDoe');
      const before = (await getPlayer(`/v1/players/${id}`, authorization)).body;

      const requestedAt = Date.now();
      await changeNickname(authorization, { nickname: 'Ferrari_Fan' }).expect(204);
      const respondedAt = Date.now();

      const after = (await getPlayer(`/v1/players/${id}`, authorization).expect(200)).body;
      expect(after.nickname).toBe('Ferrari_Fan');
      expect(after.createdAt).toBe(before.createdAt);
      expect(new Date(after.updatedAt).getTime()).toBeGreaterThanOrEqual(requestedAt);
      expect(new Date(after.updatedAt).getTime()).toBeLessThanOrEqual(respondedAt);
    });

    it('AC12 allows changing only the letter case of the own nickname', async () => {
      const { id, authorization } = await registerAndLogIn(app, 'JohnDoe');

      await changeNickname(authorization, { nickname: 'JOHNDOE' }).expect(204);

      expect(await nicknameOf(id, authorization)).toBe('JOHNDOE');
    });

    it('AC13 rejects a nickname of another player', async () => {
      const { id, authorization } = await registerAndLogIn(app, 'JohnDoe');
      await registerAndLogIn(app, 'Ferrari_Fan');

      const response = await changeNickname(authorization, { nickname: 'ferrari_fan' }).expect(409);

      expect(response.body).toEqual({ error: 'Nickname "ferrari_fan" is already taken' });
      expect(await nicknameOf(id, authorization)).toBe('JohnDoe');
    });

    it.each(['ab', 'john!'])('AC14 rejects the invalid nickname "%s"', async (nickname) => {
      const { id, authorization } = await registerAndLogIn(app, 'JohnDoe');

      await changeNickname(authorization, { nickname }).expect(400);

      expect(await nicknameOf(id, authorization)).toBe('JohnDoe');
    });

    it('AC15 keeps updatedAt when the nickname is exactly the same', async () => {
      const { id, authorization } = await registerAndLogIn(app, 'JohnDoe');
      const before = (await getPlayer(`/v1/players/${id}`, authorization)).body;

      await changeNickname(authorization, { nickname: 'JohnDoe' }).expect(204);

      expect((await getPlayer(`/v1/players/${id}`, authorization)).body.updatedAt).toBe(before.updatedAt);
    });

    // AC16 of 002 (unknown or invalid player id) no longer applies: the player comes from the token (004 AC16)

    it('AC17 rejects a body without a nickname', async () => {
      const { authorization } = await registerAndLogIn(app, 'JohnDoe');

      const response = await changeNickname(authorization, {}).expect(400);

      expect(response.body).toEqual({ error: 'nickname must be a string' });
    });
  });

  describe('errors', () => {
    it('AC18 returns an unknown route as 404 in the error format', async () => {
      const response = await request(app.getHttpServer()).get('/v1/unknown').expect(404);

      expect(response.body).toEqual({ error: expect.any(String) });
    });

    it('AC19 returns an unexpected error as 500 without internal details', async () => {
      const failingApp = await createTestApp((builder) =>
        builder.overrideProvider(PlayerRepository).useValue({
          existsWithEmail: () => Promise.reject(new Error('connection to secret-host lost')),
          existsWithNickname: () => Promise.reject(new Error('connection to secret-host lost')),
          save: () => Promise.reject(new Error('connection to secret-host lost')),
        }),
      );

      const response = await request(failingApp.getHttpServer())
        .post('/v1/players')
        .send(registration('JohnDoe'))
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal server error' });
      await failingApp.close();
    });
  });
});
