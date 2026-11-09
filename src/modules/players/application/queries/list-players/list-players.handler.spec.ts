import { InMemoryPlayerQueries } from '../../../infrastructure/in-memory/in-memory-player-queries.js';
import { ListPlayersHandler } from './list-players.handler.js';

describe('ListPlayersHandler', () => {
  it('returns every player with id and nickname, ordered by nickname ignoring letter case (R1–R3)', async () => {
    const queries = new InMemoryPlayerQueries();
    const createdAt = new Date('2026-10-23T10:15:00.000Z');
    for (const [id, nickname] of [
      ['player-1', 'johndoe'],
      ['player-2', 'Ferrari_Fan'],
      ['player-3', 'Alonso_Fan'],
    ] as const) {
      queries.players.push({ id, email: `${id}@example.com`, nickname, createdAt, updatedAt: createdAt });
    }

    await expect(new ListPlayersHandler(queries).execute()).resolves.toEqual([
      { id: 'player-3', nickname: 'Alonso_Fan' },
      { id: 'player-2', nickname: 'Ferrari_Fan' },
      { id: 'player-1', nickname: 'johndoe' },
    ]);
  });
});
