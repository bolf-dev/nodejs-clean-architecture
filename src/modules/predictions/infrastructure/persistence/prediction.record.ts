import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

/**
 * Persistence model of a prediction: the shape of a row in the `predictions` table.
 * There are no foreign keys to players and races, because those tables belong to other modules.
 */
export const PredictionRecord = defineEntity({
  name: 'PredictionRecord',
  tableName: 'predictions',
  properties: {
    id: p.uuid().primary(),
    playerId: p.uuid(),
    raceId: p.uuid(),
    pole: p.string().length(3),
    p1: p.string().length(3),
    p2: p.string().length(3),
    p3: p.string().length(3),
    submittedAt: p.datetime(),
    updatedAt: p.datetime(),
  },
  // At most one prediction per player and race (R4)
  uniques: [{ name: 'predictions_player_race_unique', properties: ['playerId', 'raceId'] }],
});

export type PredictionRecord = InferEntity<typeof PredictionRecord>;
