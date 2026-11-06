import { randomUUID } from 'node:crypto';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Email } from '../../../domain/email.value-object.js';
import { Nickname } from '../../../domain/nickname.value-object.js';
import { Password } from '../../../domain/password.value-object.js';
import { Player } from '../../../domain/player.aggregate.js';
import { EmailAlreadyRegistered, NicknameAlreadyTaken } from '../../../domain/player.errors.js';
import { PlayerRepository } from '../../../domain/player.repository.port.js';
import { PasswordHasher } from '../../ports/password-hasher.port.js';
import { RegisterPlayerCommand } from './register-player.command.js';

@CommandHandler(RegisterPlayerCommand)
export class RegisterPlayerHandler implements ICommandHandler<RegisterPlayerCommand> {
  constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: RegisterPlayerCommand): Promise<{ id: string }> {
    // In this order, so the first invalid value of email, nickname, password is reported
    const email = Email.create(command.email);
    const nickname = Nickname.create(command.nickname);
    const password = Password.create(command.password);

    if (await this.playerRepository.existsWithEmail(email)) {
      throw new EmailAlreadyRegistered(email);
    }
    if (await this.playerRepository.existsWithNickname(nickname)) {
      throw new NicknameAlreadyTaken(nickname);
    }

    const player = Player.register({
      id: randomUUID(),
      email,
      nickname,
      passwordHash: await this.passwordHasher.hash(password),
      now: new Date(),
    });
    await this.playerRepository.save(player);

    return { id: player.id };
  }
}
