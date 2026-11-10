import type { RaceData } from './race.entity.js';
import type { GridDriverData } from './season-driver.entity.js';
import { Season } from './season.aggregate.js';

const australia: RaceData = {
  round: 1,
  name: 'Australian Grand Prix',
  circuit: 'Albert Park Grand Prix Circuit',
  locality: 'Melbourne',
  country: 'Australia',
  sprintQualifyingAt: null,
  qualifyingAt: new Date('2026-03-07T05:00:00.000Z'),
  raceAt: new Date('2026-03-08T04:00:00.000Z'),
};

const driver = (externalId: string, code: string): GridDriverData => ({
  externalId,
  code,
  number: 1,
  firstName: 'John',
  lastName: 'Doe',
  team: { id: 'mclaren', name: 'McLaren' },
});

describe('Season', () => {
  describe('syncRace', () => {
    it('updates the race of a round synced again instead of adding it twice (R2)', () => {
      const season = Season.create(2026);
      const newQualifyingAt = new Date('2026-03-07T06:00:00.000Z');

      expect(season.syncRace(australia, 'race-1')).toBe(true);
      expect(season.syncRace({ ...australia, qualifyingAt: newQualifyingAt }, 'race-2')).toBe(false);

      expect(season.races).toHaveLength(1);
      expect(season.races[0]?.id).toBe('race-1');
      expect(season.races[0]?.qualifyingAt).toEqual(newQualifyingAt);
    });
  });

  describe('replaceGrid', () => {
    it('keeps the ids of drivers who stay and removes drivers who left (R9)', () => {
      const season = Season.create(2026);
      season.replaceGrid([driver('john_doe', 'DOE'), driver('jane_roe', 'ROE')], () => 'first-sync-id');
      const johnDoeId = season.drivers[0]?.id;

      season.replaceGrid([driver('john_doe', 'DOE'), driver('max_moe', 'MOE')], () => 'new-id');

      expect(season.drivers.map(({ id, code }) => [id, code.value])).toEqual([
        [johnDoeId, 'DOE'],
        ['new-id', 'MOE'],
      ]);
    });
  });
});
