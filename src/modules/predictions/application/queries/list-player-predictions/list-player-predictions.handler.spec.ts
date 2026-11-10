import { FakePlayerDirectory } from '../../../infrastructure/in-memory/fake-player-directory.js';
import { FakeRaceCatalog } from '../../../infrastructure/in-memory/fake-race-catalog.js';
import { InMemoryPredictionQueries } from '../../../infrastructure/in-memory/in-memory-prediction-queries.js';
import { PlayerNotFound } from '../../prediction.errors.js';
import { ListPlayerPredictionsHandler } from './list-player-predictions.handler.js';
import { ListPlayerPredictionsQuery } from './list-player-predictions.query.js';

describe('ListPlayerPredictionsHandler', () => {
  let handler: ListPlayerPredictionsHandler;

  const list = (viewerId: string, playerId: string) =>
    handler.execute(new ListPlayerPredictionsQuery(viewerId, playerId, 2026));

  beforeEach(() => {
    const players = new FakePlayerDirectory();
    players.playerIds.add('john-doe').add('jane-roe');
    const catalog = new FakeRaceCatalog();
    catalog.calendars.set(2026, [{ id: 'race-1', round: 1, name: 'Australian Grand Prix' }]);
    const queries = new InMemoryPredictionQueries();
    queries.predictions.push({
      playerId: 'jane-roe',
      raceId: 'race-1',
      qualifying: { p1: 'NOR', p2: 'VER', p3: 'LEC' },
      race: { p1: 'VER', p2: 'NOR', p3: 'LEC' },
      submittedAt: new Date('2026-11-10T09:00:00.000Z'),
      updatedAt: new Date('2026-11-10T09:00:00.000Z'),
    });
    handler = new ListPlayerPredictionsHandler(players, catalog, queries);
  });

  it("returns the player's own predictions with their races (R7)", async () => {
    expect(await list('jane-roe', 'jane-roe')).toEqual([
      expect.objectContaining({ raceId: 'race-1', round: 1, raceName: 'Australian Grand Prix' }),
    ]);
  });

  it('returns nothing of another player before races are finished (R8)', async () => {
    expect(await list('john-doe', 'jane-roe')).toEqual([]);
  });

  it('throws PlayerNotFound for an unknown player', async () => {
    await expect(list('john-doe', 'unknown')).rejects.toThrow(PlayerNotFound);
  });
});
