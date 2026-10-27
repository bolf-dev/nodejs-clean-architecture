import { Nickname } from './nickname.value-object.js';
import { Player } from './player.aggregate.js';

describe('Player', () => {
  it('is created with the given id and nickname, and both times set to now (R7, R8)', () => {
    const now = new Date('2026-10-23T10:15:00.000Z');

    const player = Player.create({ id: 'player-1', nickname: Nickname.create('JohnDoe'), now });

    expect(player.id).toBe('player-1');
    expect(player.nickname.value).toBe('JohnDoe');
    expect(player.createdAt).toEqual(now);
    expect(player.updatedAt).toEqual(now);
  });
});
