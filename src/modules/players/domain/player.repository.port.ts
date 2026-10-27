import type { Nickname } from './nickname.value-object.js';
import type { Player } from './player.aggregate.js';

/**
 * Port for storing players, implemented in infrastructure.
 * An abstract class instead of an interface, because NestJS needs it as an injection token at runtime.
 */
export abstract class PlayerRepository {
  abstract findById(id: string): Promise<Player | null>;

  /**
   * Whether a player with this nickname exists, ignoring letter case (R4).
   * The player `exceptPlayerId` is not counted, so a player can keep their own nickname (R6).
   */
  abstract existsWithNickname(nickname: Nickname, exceptPlayerId?: string): Promise<boolean>;

  /** Inserts a new player or updates an existing one. Throws NicknameAlreadyTaken when the nickname was taken in the meantime. */
  abstract save(player: Player): Promise<void>;
}
