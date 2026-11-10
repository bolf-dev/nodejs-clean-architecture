import { DriverNotInSeason, PodiumDriversNotDifferent } from './prediction.errors.js';
import { PredictionPicks } from './prediction-picks.value-object.js';

const grid = { season: 2026, driverCodes: ['VER', 'NOR', 'LEC', 'HAM'] };

describe('PredictionPicks', () => {
  it('accepts the pole driver on the podium (R2)', () => {
    const picks = PredictionPicks.create({ pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' }, grid);

    expect(picks).toMatchObject({ pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' });
  });

  it('rejects the same driver twice on the podium (R2)', () => {
    expect(() => PredictionPicks.create({ pole: 'NOR', p1: 'VER', p2: 'VER', p3: 'LEC' }, grid)).toThrow(
      PodiumDriversNotDifferent,
    );
  });

  it('rejects a driver who is not a driver of the season (R3)', () => {
    expect(() => PredictionPicks.create({ pole: 'XYZ', p1: 'VER', p2: 'NOR', p3: 'LEC' }, grid)).toThrow(
      new DriverNotInSeason('XYZ', 2026),
    );
  });
});
