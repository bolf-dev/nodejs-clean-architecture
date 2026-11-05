import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Nickname } from '../../../domain/nickname.value-object.js';
import { NicknameAlreadyTaken } from '../../../domain/player.errors.js';
import { PlayerRepository } from '../../../domain/player.repository.port.js';
import { PlayerNotFound } from '../../player.errors.js';
import { ChangeNicknameCommand } from './change-nickname.command.js';

@CommandHandler(ChangeNicknameCommand)
export class ChangeNicknameHandler implements ICommandHandler<ChangeNicknameCommand> {
  constructor(private readonly playerRepository: PlayerRepository) {}

  async execute(command: ChangeNicknameCommand): Promise<void> {
    const player = await this.playerRepository.findById(command.playerId);
    if (player === null) {
      throw new PlayerNotFound(command.playerId);
    }

    const nickname = Nickname.create(command.nickname);

    // The player's own nickname does not count, so only the letter case can be changed (R6)
    if (await this.playerRepository.existsWithNickname(nickname, player.id)) {
      throw new NicknameAlreadyTaken(nickname);
    }

    player.changeNickname(nickname, new Date());
    await this.playerRepository.save(player);
  }
}
