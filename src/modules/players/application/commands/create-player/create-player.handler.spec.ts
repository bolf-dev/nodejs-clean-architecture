import { InvalidNickname, NicknameAlreadyTaken } from '../../../domain/player.errors.js';
import { InMemoryPlayerRepository } from '../../../infrastructure/in-memory/in-memory-player.repository.js';
import { CreatePlayerCommand } from './create-player.command.js';
import { CreatePlayerHandler } from './create-player.handler.js';

describe('CreatePlayerHandler', () => {
  let repository: InMemoryPlayerRepository;
  let handler: CreatePlayerHandler;

  beforeEach(() => {
    repository = new InMemoryPlayerRepository();
    handler = new CreatePlayerHandler(repository);
  });

  it('saves the player and returns its id', async () => {
    const { id } = await handler.execute(new CreatePlayerCommand('JohnDoe'));

    expect(repository.players).toHaveLength(1);
    expect(repository.players[0]?.id).toBe(id);
    expect(repository.players[0]?.nickname.value).toBe('JohnDoe');
  });

  it.each(['JohnDoe', 'johndoe', 'JOHNDOE'])('rejects "%s" when "JohnDoe" is taken (R4)', async (nickname) => {
    await handler.execute(new CreatePlayerCommand('JohnDoe'));

    await expect(handler.execute(new CreatePlayerCommand(nickname))).rejects.toThrow(NicknameAlreadyTaken);
    expect(repository.players).toHaveLength(1);
  });

  it('saves nothing when the nickname is invalid', async () => {
    await expect(handler.execute(new CreatePlayerCommand('ab'))).rejects.toThrow(InvalidNickname);
    expect(repository.players).toHaveLength(0);
  });
});
