import { PredictionPicks } from './prediction-picks.value-object.js';
import { Prediction } from './prediction.aggregate.js';

const SUBMITTED_AT = new Date('2026-11-10T09:00:00.000Z');
const LATER = new Date('2026-11-10T09:30:00.000Z');

describe('Prediction', () => {
  it('changes the picks and updatedAt, but keeps submittedAt (R4)', () => {
    const prediction = Prediction.submit({
      id: 'prediction-1',
      playerId: 'player-1',
      raceId: 'race-1',
      picks: PredictionPicks.reconstitute({
        qualifying: { p1: 'NOR', p2: 'VER', p3: 'LEC' },
        race: { p1: 'VER', p2: 'NOR', p3: 'LEC' },
      }),
      now: SUBMITTED_AT,
    });
    const newPicks = PredictionPicks.reconstitute({
      qualifying: { p1: 'VER', p2: 'NOR', p3: 'HAM' },
      race: { p1: 'NOR', p2: 'VER', p3: 'HAM' },
    });

    prediction.change(newPicks, LATER);

    expect(prediction.picks).toBe(newPicks);
    expect(prediction.submittedAt).toEqual(SUBMITTED_AT);
    expect(prediction.updatedAt).toEqual(LATER);
  });
});
