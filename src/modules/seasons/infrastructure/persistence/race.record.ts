import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

/** Persistence model of a race: the shape of a row in the `races` table. */
export const RaceRecord = defineEntity({
  name: 'RaceRecord',
  tableName: 'races',
  properties: {
    id: p.uuid().primary(),
    season: p.integer(),
    round: p.integer(),
    name: p.string().length(100),
    circuit: p.string().length(100),
    locality: p.string().length(100),
    country: p.string().length(100),
    sprintQualifyingAt: p.datetime().nullable(),
    qualifyingAt: p.datetime(),
    raceAt: p.datetime(),
  },
  // A race is identified by its season and round (R5)
  uniques: [{ name: 'races_season_round_unique', properties: ['season', 'round'] }],
});

export type RaceRecord = InferEntity<typeof RaceRecord>;
