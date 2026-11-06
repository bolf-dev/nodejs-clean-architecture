import { Email } from './email.value-object.js';
import { Nickname } from './nickname.value-object.js';
import { Player } from './player.aggregate.js';

const CREATED_AT = new Date('2026-10-23T10:15:00.000Z');
const LATER = new Date('2026-10-24T08:00:00.000Z');

const registerJohnDoe = () =>
  Player.register({
    id: 'player-1',
    email: Email.create('johndoe@example.com'),
    nickname: Nickname.create('JohnDoe'),
    passwordHash: 'hashed:correct-horse',
    now: CREATED_AT,
  });

describe('Player', () => {
  it('is registered with the given values, and both times set to now (R7, R8)', () => {
    const player = registerJohnDoe();

    expect(player.id).toBe('player-1');
    expect(player.email.value).toBe('johndoe@example.com');
    expect(player.nickname.value).toBe('JohnDoe');
    expect(player.passwordHash).toBe('hashed:correct-horse');
    expect(player.createdAt).toEqual(CREATED_AT);
    expect(player.updatedAt).toEqual(CREATED_AT);
  });

  it('is reconstituted with all stored values', () => {
    const player = Player.reconstitute({
      id: 'player-1',
      email: Email.create('johndoe@example.com'),
      nickname: Nickname.create('JohnDoe'),
      passwordHash: 'hashed:correct-horse',
      createdAt: CREATED_AT,
      updatedAt: LATER,
    });

    expect(player.email.value).toBe('johndoe@example.com');
    expect(player.nickname.value).toBe('JohnDoe');
    expect(player.passwordHash).toBe('hashed:correct-horse');
    expect(player.createdAt).toEqual(CREATED_AT);
    expect(player.updatedAt).toEqual(LATER);
  });

  describe('changeNickname', () => {
    let player: Player;

    beforeEach(() => {
      player = registerJohnDoe();
    });

    it('changes the nickname and updatedAt, but not createdAt (R6, R8)', () => {
      player.changeNickname(Nickname.create('JaneDoe'), LATER);

      expect(player.nickname.value).toBe('JaneDoe');
      expect(player.updatedAt).toEqual(LATER);
      expect(player.createdAt).toEqual(CREATED_AT);
    });

    it('treats a different letter case as a change', () => {
      player.changeNickname(Nickname.create('JOHNDOE'), LATER);

      expect(player.nickname.value).toBe('JOHNDOE');
      expect(player.updatedAt).toEqual(LATER);
    });

    it('changes nothing for exactly the same nickname (R9)', () => {
      player.changeNickname(Nickname.create('JohnDoe'), LATER);

      expect(player.nickname.value).toBe('JohnDoe');
      expect(player.updatedAt).toEqual(CREATED_AT);
    });
  });
});
