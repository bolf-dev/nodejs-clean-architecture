import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PlayerRepository } from '../src/modules/players/domain/player.repository.port.js';
import { clearDatabase, query } from './support/database.js';
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
  const getPlayer = (path: string) => request(app.getHttpServer()).get(path);
  const changeNickname = (id: string, body: object) =>
    request(app.getHttpServer()).patch(`/v1/players/${id}`).send(body);
  const createPlayerId = async (nickname: string): Promise<string> =>
    (await createPlayer({ nickname }).expect(201)).body.id;
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
      const response = await createPlayer({ nickname: 'JohnDoe' }).expect(201);

      expect(response.body).toEqual({ id: expect.stringMatching(UUID) });
      expect(response.headers.location).toBe(`/v1/players/${response.body.id}`);

      const player = await getPlayer(response.headers.location as string).expect(200);
      expect(player.body).toMatchObject({ id: response.body.id, nickname: 'JohnDoe' });
      expect(player.body.createdAt).toBe(player.body.updatedAt);
    });

    it('AC2 stores the nickname without leading and trailing whitespace', async () => {
      await createPlayer({ nickname: '  JohnDoe  ' }).expect(201);

      const [player] = await storedPlayers();
      expect(player?.nickname).toBe('JohnDoe');
    });

    it.each(['ab', 'a'.repeat(21)])('AC3 rejects "%s", which is not 3 to 20 characters long', async (nickname) => {
      const response = await createPlayer({ nickname }).expect(400);

      expect(response.body).toEqual({ error: 'Nickname must be 3 to 20 characters long' });
      expect(await storedPlayers()).toHaveLength(0);
    });

    it.each(['abc', 'a'.repeat(20)])('AC3 accepts "%s", which is 3 to 20 characters long', async (nickname) => {
      await createPlayer({ nickname }).expect(201);
    });

    it.each(['john!', 'john doe', 'jöhn'])('AC4 rejects "%s" with characters that are not allowed', async (nickname) => {
      const response = await createPlayer({ nickname }).expect(400);

      expect(response.body).toEqual({ error: 'Nickname may contain only letters, digits, "-" and "_"' });
    });

    it.each(['john_97', 'john-doe'])('AC4 accepts "%s"', async (nickname) => {
      await createPlayer({ nickname }).expect(201);
    });

    it.each(['johndoe', 'JOHNDOE'])('AC5 rejects "%s" when "JohnDoe" exists', async (nickname) => {
      await createPlayer({ nickname: 'JohnDoe' }).expect(201);

      const response = await createPlayer({ nickname }).expect(409);

      expect(response.body).toEqual({ error: `Nickname "${nickname}" is already taken` });
      expect(await storedPlayers()).toHaveLength(1);
    });

    it('AC6 accepts only one of two concurrent requests with the same nickname', async () => {
      const responses = await Promise.all([
        createPlayer({ nickname: 'JohnDoe' }),
        createPlayer({ nickname: 'JohnDoe' }),
      ]);

      expect(responses.map(({ status }) => status).sort((a, b) => a - b)).toEqual([201, 409]);
      expect(await storedPlayers()).toHaveLength(1);
    });

    it.each([{}, { nickname: 123 }])('AC7 rejects the body %j', async (body) => {
      const response = await createPlayer(body).expect(400);

      expect(response.body).toEqual({ error: 'nickname must be a string' });
    });
  });

  describe('GET /v1/players/{playerId}', () => {
    it('AC8 returns the player', async () => {
      const created = await createPlayer({ nickname: 'JohnDoe' }).expect(201);
      const [stored] = await storedPlayers();

      const response = await getPlayer(`/v1/players/${created.body.id}`).expect(200);

      expect(response.body).toEqual({
        id: created.body.id,
        nickname: 'JohnDoe',
        createdAt: new Date(stored!.created_at).toISOString(),
        updatedAt: new Date(stored!.updated_at).toISOString(),
      });
    });

    it('AC9 returns 404 for an unknown id', async () => {
      const id = '0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b';

      const response = await getPlayer(`/v1/players/${id}`).expect(404);

      expect(response.body).toEqual({ error: `Player "${id}" not found` });
    });

    it('AC10 returns 400 when the id is not a UUID', async () => {
      const response = await getPlayer('/v1/players/123').expect(400);

      expect(response.body).toEqual({ error: 'playerId must be a UUID' });
    });
  });

  describe('PATCH /v1/players/{playerId}', () => {
    it('AC11 changes the nickname and updatedAt, createdAt stays', async () => {
      const id = await createPlayerId('JohnDoe');
      const before = (await getPlayer(`/v1/players/${id}`)).body;

      const requestedAt = Date.now();
      await changeNickname(id, { nickname: 'Ferrari_Fan' }).expect(204);
      const respondedAt = Date.now();

      const after = (await getPlayer(`/v1/players/${id}`).expect(200)).body;
      expect(after.nickname).toBe('Ferrari_Fan');
      expect(after.createdAt).toBe(before.createdAt);
      expect(new Date(after.updatedAt).getTime()).toBeGreaterThanOrEqual(requestedAt);
      expect(new Date(after.updatedAt).getTime()).toBeLessThanOrEqual(respondedAt);
    });

    it('AC12 allows changing only the letter case of the own nickname', async () => {
      const id = await createPlayerId('JohnDoe');

      await changeNickname(id, { nickname: 'JOHNDOE' }).expect(204);

      expect((await getPlayer(`/v1/players/${id}`)).body.nickname).toBe('JOHNDOE');
    });

    it('AC13 rejects a nickname of another player', async () => {
      const id = await createPlayerId('JohnDoe');
      await createPlayerId('Ferrari_Fan');

      const response = await changeNickname(id, { nickname: 'ferrari_fan' }).expect(409);

      expect(response.body).toEqual({ error: 'Nickname "ferrari_fan" is already taken' });
      expect((await getPlayer(`/v1/players/${id}`)).body.nickname).toBe('JohnDoe');
    });

    it.each(['ab', 'john!'])('AC14 rejects the invalid nickname "%s"', async (nickname) => {
      const id = await createPlayerId('JohnDoe');

      await changeNickname(id, { nickname }).expect(400);

      expect((await getPlayer(`/v1/players/${id}`)).body.nickname).toBe('JohnDoe');
    });

    it('AC15 keeps updatedAt when the nickname is exactly the same', async () => {
      const id = await createPlayerId('JohnDoe');
      const before = (await getPlayer(`/v1/players/${id}`)).body;

      await changeNickname(id, { nickname: 'JohnDoe' }).expect(204);

      expect((await getPlayer(`/v1/players/${id}`)).body.updatedAt).toBe(before.updatedAt);
    });

    it('AC16 returns 404 for an unknown player and 400 for an id that is not a UUID', async () => {
      const unknownId = '0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b';

      const notFound = await changeNickname(unknownId, { nickname: 'JohnDoe' }).expect(404);
      const invalidId = await changeNickname('123', { nickname: 'JohnDoe' }).expect(400);

      expect(notFound.body).toEqual({ error: `Player "${unknownId}" not found` });
      expect(invalidId.body).toEqual({ error: 'playerId must be a UUID' });
    });

    it('AC17 rejects a body without a nickname', async () => {
      const id = await createPlayerId('JohnDoe');

      const response = await changeNickname(id, {}).expect(400);

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
          existsWithNickname: () => Promise.reject(new Error('connection to secret-host lost')),
          save: () => Promise.reject(new Error('connection to secret-host lost')),
        }),
      );

      const response = await request(failingApp.getHttpServer())
        .post('/v1/players')
        .send({ nickname: 'JohnDoe' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal server error' });
      await failingApp.close();
    });
  });
});
