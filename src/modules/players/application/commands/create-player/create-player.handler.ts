import { randomUUID } from 'node:crypto';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Nickname } from '../../../domain/nickname.value-object.js';
import { Player } from '../../../domain/player.aggregate.js';
import { NicknameAlreadyTaken } from '../../../domain/player.errors.js';
import { PlayerRepository } from '../../../domain/player.repository.port.js';
import { CreatePlayerCommand } from './create-player.command.js';

@CommandHandler(CreatePlayerCommand)
export class CreatePlayerHandler implements ICommandHandler<CreatePlayerCommand> {
  constructor(private readonly playerRepository: PlayerRepository) {}

  async execute(command: CreatePlayerCommand): Promise<{ id: string }> {
    const nickname = Nickname.create(command.nickname);

    if (await this.playerRepository.existsWithNickname(nickname)) {
      throw new NicknameAlreadyTaken(nickname);
    }

    const player = Player.create({ id: randomUUID(), nickname, now: new Date() });
    await this.playerRepository.save(player);

    return { id: player.id };
  }
}
