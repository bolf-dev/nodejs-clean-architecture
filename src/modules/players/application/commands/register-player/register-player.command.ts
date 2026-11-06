import { Command } from '@nestjs/cqrs';

/**
 * Register a player with this email, nickname and password. All values are raw input,
 * the domain decides whether they are valid. Returns the id of the new player.
 */
export class RegisterPlayerCommand extends Command<{ id: string }> {
  constructor(
    readonly email: string,
    readonly nickname: string,
    readonly password: string,
  ) {
    super();
  }
}
