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
  created_at: Date;
  updated_at: Date;
}

describe('Players (e2e)', () => {
  let app: INestApplication<App>;

  const createPlayer = (body: object) => request(app.getHttpServer()).post('/v1/players').send(body);
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

      const [player] = await storedPlayers();
      expect(player).toMatchObject({ id: response.body.id, nickname: 'JohnDoe' });
      expect(player?.created_at).toEqual(player?.updated_at);
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
