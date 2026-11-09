import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { clearDatabase, query } from './support/database.js';
import { registration } from './support/registration.js';
import { createTestApp } from './support/test-app.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface CredentialsRow {
  email: string;
  password_hash: string;
}

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  const register = (body: object) => request(app.getHttpServer()).post('/v1/players').send(body);
  const logIn = (body: object) => request(app.getHttpServer()).post('/v1/auth/login').send(body);
  const storedCredentials = () =>
    query<CredentialsRow>(app, 'select email, password_hash from players order by created_at');

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/players (registration)', () => {
    it('AC1 registers a player and returns its id and location', async () => {
      const response = await register({
        email: 'johndoe@example.com',
        nickname: 'JohnDoe',
        password: 'correct-horse',
      }).expect(201);

      expect(response.body).toEqual({ id: expect.stringMatching(UUID) });
      expect(response.headers.location).toBe(`/v1/players/${response.body.id}`);
      expect(await storedCredentials()).toEqual([
        { email: 'johndoe@example.com', password_hash: expect.any(String) },
      ]);
    });

    it('AC2 stores the email trimmed and in lower case', async () => {
      await register(registration('JohnDoe', { email: '  JohnDoe@Example.COM ' })).expect(201);

      const [stored] = await storedCredentials();
      expect(stored?.email).toBe('johndoe@example.com');
    });

    it.each(['johndoe', 'john doe@example.com', 'john@example'])('AC3 rejects the email "%s"', async (email) => {
      const response = await register(registration('JohnDoe', { email })).expect(400);

      expect(response.body).toEqual({ error: 'Email is not valid' });
      expect(await storedCredentials()).toHaveLength(0);
    });

    it('AC4 rejects a registered email in another letter case', async () => {
      await register(registration('JohnDoe', { email: 'johndoe@example.com' })).expect(201);

      const response = await register(registration('JaneDoe', { email: 'JOHNDOE@example.com' })).expect(409);

      expect(response.body).toEqual({ error: 'Email "johndoe@example.com" is already registered' });
      expect(await storedCredentials()).toHaveLength(1);
    });

    it('AC4 accepts only one of two concurrent registrations with the same email', async () => {
      const responses = await Promise.all([
        register(registration('JohnDoe', { email: 'johndoe@example.com' })),
        register(registration('JaneDoe', { email: 'johndoe@example.com' })),
      ]);

      expect(responses.map(({ status }) => status).sort((a, b) => a - b)).toEqual([201, 409]);
      expect(await storedCredentials()).toHaveLength(1);
    });

    it.each(['a'.repeat(7), 'a'.repeat(129)])('AC5 rejects a password of %#: not 8 to 128 characters', async (password) => {
      const response = await register(registration('JohnDoe', { password })).expect(400);

      expect(response.body).toEqual({ error: 'Password must be 8 to 128 characters long' });
    });

    it.each(['a'.repeat(8), 'a'.repeat(128)])('AC5 accepts a password of %#: 8 to 128 characters', async (password) => {
      await register(registration('JohnDoe', { password })).expect(201);
    });

    it('AC6 rejects an invalid or taken nickname as in 002', async () => {
      await register(registration('JohnDoe')).expect(201);

      const invalid = await register(registration('ab')).expect(400);
      const taken = await register(registration('johndoe')).expect(409);

      expect(invalid.body).toEqual({ error: 'Nickname must be 3 to 20 characters long' });
      expect(taken.body).toEqual({ error: 'Nickname "johndoe" is already taken' });
    });

    it.each(['email', 'nickname', 'password'])('AC7 rejects a body without %s', async (field) => {
      const response = await register(registration('JohnDoe', { [field]: undefined })).expect(400);

      expect(response.body).toEqual({ error: `${field} must be a string` });
    });

    it('AC8 stores only a hash of the password and never returns it', async () => {
      const response = await register(registration('JohnDoe', { password: 'correct-horse' })).expect(201);

      const [stored] = await storedCredentials();
      expect(stored?.password_hash).toMatch(/^scrypt\$/);
      expect(stored?.password_hash).not.toContain('correct-horse');
      expect(JSON.stringify(response.body)).not.toContain('correct-horse');
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(async () => {
      await register(registration('JohnDoe', { email: 'johndoe@example.com', password: 'correct-horse' })).expect(201);
    });

    it('AC9 returns an access token valid for 7 days, the email in any letter case', async () => {
      const requestedAt = Date.now();
      const response = await logIn({ email: 'JohnDoe@Example.com', password: 'correct-horse' }).expect(200);

      expect(response.body).toEqual({
        accessToken: expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/),
        expiresAt: expect.any(String),
      });
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(response.body.expiresAt).getTime();
      expect(expiresAt).toBeGreaterThanOrEqual(requestedAt + sevenDays - 1000);
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + sevenDays);
    });

    it.each([
      ['a wrong password', { email: 'johndoe@example.com', password: 'wrong-horse' }],
      ['an unknown email', { email: 'janedoe@example.com', password: 'correct-horse' }],
    ])('AC10 rejects %s with the same error', async (_, body) => {
      const response = await logIn(body).expect(401);

      expect(response.body).toEqual({ error: 'Invalid email or password' });
    });

    it('rejects a body without a password', async () => {
      const response = await logIn({ email: 'johndoe@example.com' }).expect(400);

      expect(response.body).toEqual({ error: 'password must be a string' });
    });
  });
});
