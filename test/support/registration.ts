import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';

let counter = 0;

/**
 * A valid registration body for POST /v1/players. Every call gets its own email,
 * so tests about nicknames never collide on the email. `overrides` replaces any field.
 */
export function registration(nickname: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  counter += 1;
  return { email: `player${counter}@example.com`, nickname, password: 'correct-horse', ...overrides };
}

/** Registers a player and logs them in. Returns the player id and the `Authorization` header value. */
export async function registerAndLogIn(
  app: INestApplication<App>,
  nickname: string,
): Promise<{ id: string; authorization: string }> {
  const body = registration(nickname);
  const registered = await request(app.getHttpServer()).post('/v1/players').send(body).expect(201);
  const loggedIn = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email: body.email, password: body.password })
    .expect(200);
  return { id: registered.body.id, authorization: `Bearer ${loggedIn.body.accessToken}` };
}
