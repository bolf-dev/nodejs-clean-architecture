import type { Nickname } from './nickname.value-object.js';
import type { Player } from './player.aggregate.js';

/**
 * Port for storing players, implemented in infrastructure.
 * An abstract class instead of an interface, because NestJS needs it as an injection token at runtime.
 */
export abstract class PlayerRepository {
  /** Whether a player with this nickname exists, ignoring letter case (R4). */
  abstract existsWithNickname(nickname: Nickname): Promise<boolean>;

  /** Throws NicknameAlreadyTaken when the nickname was taken in the meantime. */
  abstract save(player: Player): Promise<void>;
}
