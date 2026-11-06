import {
  EmailAlreadyRegistered,
  InvalidEmail,
  InvalidNickname,
  InvalidPassword,
  NicknameAlreadyTaken,
} from '../../../domain/player.errors.js';
import { FakePasswordHasher } from '../../../infrastructure/in-memory/fake-password-hasher.js';
import { InMemoryPlayerRepository } from '../../../infrastructure/in-memory/in-memory-player.repository.js';
import { RegisterPlayerCommand } from './register-player.command.js';
import { RegisterPlayerHandler } from './register-player.handler.js';

describe('RegisterPlayerHandler', () => {
  let repository: InMemoryPlayerRepository;
  let handler: RegisterPlayerHandler;

  const register = (email: string, nickname: string, password = 'correct-horse') =>
    handler.execute(new RegisterPlayerCommand(email, nickname, password));

  beforeEach(() => {
    repository = new InMemoryPlayerRepository();
    handler = new RegisterPlayerHandler(repository, new FakePasswordHasher());
  });

  it('saves the player with the hashed password and returns its id', async () => {
    const { id } = await register('JohnDoe@Example.com', 'JohnDoe');

    expect(repository.players).toHaveLength(1);
    const [player] = repository.players;
    expect(player?.id).toBe(id);
    expect(player?.email.value).toBe('johndoe@example.com');
    expect(player?.nickname.value).toBe('JohnDoe');
    expect(player?.passwordHash).toBe('hashed:correct-horse');
  });

  it('rejects a registered email in any letter case (R3)', async () => {
    await register('johndoe@example.com', 'JohnDoe');

    await expect(register('JOHNDOE@example.com', 'JaneDoe')).rejects.toThrow(EmailAlreadyRegistered);
    expect(repository.players).toHaveLength(1);
  });

  it.each(['JohnDoe', 'johndoe'])('rejects "%s" when "JohnDoe" is taken', async (nickname) => {
    await register('johndoe@example.com', 'JohnDoe');

    await expect(register('janedoe@example.com', nickname)).rejects.toThrow(NicknameAlreadyTaken);
    expect(repository.players).toHaveLength(1);
  });

  it('reports the first invalid value in the order email, nickname, password', async () => {
    await expect(register('johndoe', 'ab', 'short')).rejects.toThrow(InvalidEmail);
    await expect(register('johndoe@example.com', 'ab', 'short')).rejects.toThrow(InvalidNickname);
    await expect(register('johndoe@example.com', 'JohnDoe', 'short')).rejects.toThrow(InvalidPassword);
    expect(repository.players).toHaveLength(0);
  });
});
