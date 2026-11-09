import { FakePasswordHasher } from '../../../infrastructure/in-memory/fake-password-hasher.js';
import { FakeTokenService } from '../../../infrastructure/in-memory/fake-token-service.js';
import { InMemoryPlayerQueries } from '../../../infrastructure/in-memory/in-memory-player-queries.js';
import { InvalidCredentials } from '../../player.errors.js';
import { LogInHandler } from './log-in.handler.js';
import { LogInQuery } from './log-in.query.js';

describe('LogInHandler', () => {
  let handler: LogInHandler;

  beforeEach(() => {
    const queries = new InMemoryPlayerQueries();
    queries.credentials.push({
      email: 'johndoe@example.com',
      playerId: 'player-1',
      passwordHash: 'hashed:correct-horse',
    });
    handler = new LogInHandler(queries, new FakePasswordHasher(), new FakeTokenService());
  });

  it('returns an access token for the right email and password (R7)', async () => {
    await expect(handler.execute(new LogInQuery('johndoe@example.com', 'correct-horse'))).resolves.toEqual({
      accessToken: 'token-player-1',
      expiresAt: FakeTokenService.EXPIRES_AT,
    });
  });

  it('matches the email in any letter case and with whitespace (R7)', async () => {
    const { accessToken } = await handler.execute(new LogInQuery('  JohnDoe@Example.COM ', 'correct-horse'));

    expect(accessToken).toBe('token-player-1');
  });

  it.each([
    ['a wrong password', 'johndoe@example.com', 'wrong-horse'],
    ['an unknown email', 'janedoe@example.com', 'correct-horse'],
    ['an email that is not valid', 'johndoe', 'correct-horse'],
  ])('rejects %s with the same error (R8)', async (_, email, password) => {
    await expect(handler.execute(new LogInQuery(email, password))).rejects.toThrow(InvalidCredentials);
  });
});
