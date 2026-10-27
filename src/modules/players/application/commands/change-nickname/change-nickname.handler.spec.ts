import { Nickname } from '../../../domain/nickname.value-object.js';
import { Player } from '../../../domain/player.aggregate.js';
import { InvalidNickname, NicknameAlreadyTaken } from '../../../domain/player.errors.js';
import { InMemoryPlayerRepository } from '../../../infrastructure/in-memory/in-memory-player.repository.js';
import { PlayerNotFound } from '../../player.errors.js';
import { ChangeNicknameCommand } from './change-nickname.command.js';
import { ChangeNicknameHandler } from './change-nickname.handler.js';

const CREATED_AT = new Date('2026-10-23T10:15:00.000Z');

describe('ChangeNicknameHandler', () => {
  let repository: InMemoryPlayerRepository;
  let handler: ChangeNicknameHandler;

  const addPlayer = (id: string, nickname: string) =>
    repository.save(Player.create({ id, nickname: Nickname.create(nickname), now: CREATED_AT }));
  const nicknameOf = async (id: string) => (await repository.findById(id))?.nickname.value;

  beforeEach(async () => {
    repository = new InMemoryPlayerRepository();
    handler = new ChangeNicknameHandler(repository);
    await addPlayer('player-1', 'JohnDoe');
  });

  it('changes the nickname', async () => {
    await handler.execute(new ChangeNicknameCommand('player-1', 'JaneDoe'));

    expect(await nicknameOf('player-1')).toBe('JaneDoe');
  });

  it('allows changing only the letter case of the own nickname (R6)', async () => {
    await handler.execute(new ChangeNicknameCommand('player-1', 'JOHNDOE'));

    expect(await nicknameOf('player-1')).toBe('JOHNDOE');
  });

  it('rejects a nickname of another player in any letter case (R4)', async () => {
    await addPlayer('player-2', 'JaneDoe');

    await expect(handler.execute(new ChangeNicknameCommand('player-1', 'janedoe'))).rejects.toThrow(
      NicknameAlreadyTaken,
    );
    expect(await nicknameOf('player-1')).toBe('JohnDoe');
  });

  it('rejects an invalid nickname', async () => {
    await expect(handler.execute(new ChangeNicknameCommand('player-1', 'ab'))).rejects.toThrow(InvalidNickname);
    expect(await nicknameOf('player-1')).toBe('JohnDoe');
  });

  it('throws PlayerNotFound for an unknown player', async () => {
    await expect(handler.execute(new ChangeNicknameCommand('unknown', 'JaneDoe'))).rejects.toThrow(PlayerNotFound);
  });
});
