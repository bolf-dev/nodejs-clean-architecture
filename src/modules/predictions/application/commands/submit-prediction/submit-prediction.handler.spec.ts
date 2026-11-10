import { FakeRaceCatalog } from '../../../infrastructure/in-memory/fake-race-catalog.js';
import { InMemoryPredictionRepository } from '../../../infrastructure/in-memory/in-memory-prediction.repository.js';
import { RaceNotFound } from '../../prediction.errors.js';
import { SubmitPredictionCommand } from './submit-prediction.command.js';
import { SubmitPredictionHandler } from './submit-prediction.handler.js';

describe('SubmitPredictionHandler', () => {
  let repository: InMemoryPredictionRepository;
  let handler: SubmitPredictionHandler;

  const submit = (raceId: string, [q1, q2, q3]: string[], [r1, r2, r3]: string[]) =>
    handler.execute(
      new SubmitPredictionCommand('player-1', raceId, { p1: q1!, p2: q2!, p3: q3! }, { p1: r1!, p2: r2!, p3: r3! }),
    );

  beforeEach(() => {
    const catalog = new FakeRaceCatalog();
    catalog.races.set('race-1', 2026);
    catalog.drivers.set(2026, ['VER', 'NOR', 'LEC', 'HAM']);
    repository = new InMemoryPredictionRepository();
    handler = new SubmitPredictionHandler(catalog, repository);
  });

  afterEach(() => vi.useRealTimers());

  it('saves a new prediction of the player for the race (R1)', async () => {
    await submit('race-1', ['NOR', 'VER', 'LEC'], ['VER', 'NOR', 'LEC']);

    expect(repository.predictions).toHaveLength(1);
    expect(repository.predictions[0]).toMatchObject({
      playerId: 'player-1',
      raceId: 'race-1',
      picks: { qualifying: { p1: 'NOR', p2: 'VER', p3: 'LEC' }, race: { p1: 'VER', p2: 'NOR', p3: 'LEC' } },
    });
  });

  it('replaces the prediction when the player submits again, keeping submittedAt (R4)', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-10T09:00:00.000Z') });
    await submit('race-1', ['NOR', 'VER', 'LEC'], ['VER', 'NOR', 'LEC']);
    vi.setSystemTime(new Date('2026-11-10T09:30:00.000Z'));

    await submit('race-1', ['VER', 'HAM', 'LEC'], ['HAM', 'LEC', 'NOR']);

    expect(repository.predictions).toHaveLength(1);
    expect(repository.predictions[0]).toMatchObject({
      picks: { qualifying: { p1: 'VER', p2: 'HAM', p3: 'LEC' }, race: { p1: 'HAM', p2: 'LEC', p3: 'NOR' } },
      submittedAt: new Date('2026-11-10T09:00:00.000Z'),
      updatedAt: new Date('2026-11-10T09:30:00.000Z'),
    });
  });

  it('throws RaceNotFound for an unknown race', async () => {
    await expect(submit('unknown', ['NOR', 'VER', 'LEC'], ['VER', 'NOR', 'LEC'])).rejects.toThrow(RaceNotFound);
    expect(repository.predictions).toHaveLength(0);
  });
});
