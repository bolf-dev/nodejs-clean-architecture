import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

/** Persistence model of a driver of a season's grid: the shape of a row in the `season_drivers` table. */
export const SeasonDriverRecord = defineEntity({
  name: 'SeasonDriverRecord',
  tableName: 'season_drivers',
  properties: {
    id: p.uuid().primary(),
    season: p.integer(),
    externalId: p.string().length(50),
    code: p.string().length(3),
    number: p.integer(),
    firstName: p.string().length(100),
    lastName: p.string().length(100),
    teamId: p.string().length(50).nullable(),
    teamName: p.string().length(100).nullable(),
  },
  uniques: [{ name: 'season_drivers_season_external_id_unique', properties: ['season', 'externalId'] }],
});

export type SeasonDriverRecord = InferEntity<typeof SeasonDriverRecord>;
