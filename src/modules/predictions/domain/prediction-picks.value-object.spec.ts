import { DriverNotInSeason, PodiumDriversNotDifferent } from './prediction.errors.js';
import { PredictionPicks } from './prediction-picks.value-object.js';

const grid = { season: 2026, driverCodes: ['VER', 'NOR', 'LEC', 'HAM'] };

describe('PredictionPicks', () => {
  it('accepts a driver on both podiums (R2)', () => {
    const picks = PredictionPicks.create(
      { qualifying: { p1: 'NOR', p2: 'VER', p3: 'LEC' }, race: { p1: 'VER', p2: 'NOR', p3: 'LEC' } },
      grid,
    );

    expect(picks.qualifying).toEqual({ p1: 'NOR', p2: 'VER', p3: 'LEC' });
    expect(picks.race).toEqual({ p1: 'VER', p2: 'NOR', p3: 'LEC' });
  });

  it.each([
    ['Qualifying', { p1: 'NOR', p2: 'NOR', p3: 'LEC' }, { p1: 'VER', p2: 'NOR', p3: 'LEC' }],
    ['Race', { p1: 'NOR', p2: 'VER', p3: 'LEC' }, { p1: 'VER', p2: 'NOR', p3: 'VER' }],
  ] as const)('rejects the same driver twice in the %s top 3 (R2)', (session, qualifying, race) => {
    expect(() => PredictionPicks.create({ qualifying, race }, grid)).toThrow(new PodiumDriversNotDifferent(session));
  });

  it('rejects a driver who is not a driver of the season (R3)', () => {
    expect(() =>
      PredictionPicks.create(
        { qualifying: { p1: 'NOR', p2: 'VER', p3: 'LEC' }, race: { p1: 'XYZ', p2: 'NOR', p3: 'LEC' } },
        grid,
      ),
    ).toThrow(new DriverNotInSeason('XYZ', 2026));
  });
});
