import { Command } from '@nestjs/cqrs';

/**
 * Create a player with this nickname. The nickname is raw input,
 * the domain decides whether it is valid. Returns the id of the new player.
 */
export class CreatePlayerCommand extends Command<{ id: string }> {
  constructor(readonly nickname: string) {
    super();
  }
}
