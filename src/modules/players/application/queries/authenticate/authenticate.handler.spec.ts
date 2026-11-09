import { FakeTokenService } from '../../../infrastructure/in-memory/fake-token-service.js';
import { InMemoryPlayerQueries } from '../../../infrastructure/in-memory/in-memory-player-queries.js';
import { InvalidAccessToken } from '../../player.errors.js';
import { AuthenticateHandler } from './authenticate.handler.js';
import { AuthenticateQuery } from './authenticate.query.js';

describe('AuthenticateHandler', () => {
  let handler: AuthenticateHandler;

  beforeEach(() => {
    const queries = new InMemoryPlayerQueries();
    queries.players.push({
      id: 'player-1',
      email: 'johndoe@example.com',
      nickname: 'JohnDoe',
      createdAt: new Date('2026-10-23T10:15:00.000Z'),
      updatedAt: new Date('2026-10-23T10:15:00.000Z'),
    });
    handler = new AuthenticateHandler(new FakeTokenService(), queries);
  });

  it('returns the id of the player the token belongs to (R10)', async () => {
    await expect(handler.execute(new AuthenticateQuery('token-player-1'))).resolves.toBe('player-1');
  });

  it('rejects an invalid token', async () => {
    await expect(handler.execute(new AuthenticateQuery('not-a-token'))).rejects.toThrow(InvalidAccessToken);
  });

  it('rejects a valid token of a player who no longer exists', async () => {
    await expect(handler.execute(new AuthenticateQuery('token-player-2'))).rejects.toThrow(InvalidAccessToken);
  });
});
