import { InMemoryPlayerQueries } from '../../../infrastructure/in-memory/in-memory-player-queries.js';
import { PlayerNotFound } from '../../player.errors.js';
import { GetPlayerHandler } from './get-player.handler.js';
import { GetPlayerQuery } from './get-player.query.js';

describe('GetPlayerHandler', () => {
  let queries: InMemoryPlayerQueries;
  let handler: GetPlayerHandler;

  beforeEach(() => {
    queries = new InMemoryPlayerQueries();
    handler = new GetPlayerHandler(queries);
  });

  it('returns the player', async () => {
    const player = {
      id: 'player-1',
      email: 'johndoe@example.com',
      nickname: 'JohnDoe',
      createdAt: new Date('2026-10-23T10:15:00.000Z'),
      updatedAt: new Date('2026-10-23T10:15:00.000Z'),
    };
    queries.players.push(player);

    await expect(handler.execute(new GetPlayerQuery('player-1'))).resolves.toEqual(player);
  });

  it('throws PlayerNotFound for an unknown id', async () => {
    await expect(handler.execute(new GetPlayerQuery('unknown'))).rejects.toThrow(PlayerNotFound);
  });
});
