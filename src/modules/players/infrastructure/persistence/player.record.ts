import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

/**
 * Persistence model of a player: the shape of a row in the `players` table.
 * It is separate from the Player aggregate, so the domain stays free of ORM code.
 */
export const PlayerRecord = defineEntity({
  name: 'PlayerRecord',
  tableName: 'players',
  properties: {
    id: p.uuid().primary(),
    email: p.string().length(254),
    nickname: p.string().length(20),
    passwordHash: p.string().length(255),
    createdAt: p.datetime(),
    updatedAt: p.datetime(),
  },
  uniques: [
    // Emails are stored in lower case, so a plain unique index is enough
    { name: 'players_email_unique', properties: ['email'] },
    {
      // Nicknames are unique regardless of letter case, also for concurrent requests
      name: 'players_nickname_lower_unique',
      expression:
        'create unique index "players_nickname_lower_unique" on "players" (lower("nickname"))',
    },
  ],
});

export type PlayerRecord = InferEntity<typeof PlayerRecord>;
