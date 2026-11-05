import { Command } from '@nestjs/cqrs';

/** Change the nickname of a player. The nickname is raw input, the domain decides whether it is valid. */
export class ChangeNicknameCommand extends Command<void> {
  constructor(
    readonly playerId: string,
    readonly nickname: string,
  ) {
    super();
  }
}
