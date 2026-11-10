import type { PlayerCredentials, PlayerListItem, PlayerReadModel } from '../player.read-model.js';

/** Port for reading players on the read side, implemented in infrastructure. */
export abstract class PlayerQueries {
  abstract findById(id: string): Promise<PlayerReadModel | null>;

  /** Every player, ordered by nickname ignoring letter case (R2 of spec 005). */
  abstract listAll(): Promise<PlayerListItem[]>;

  /** The credentials of the player with this email, already trimmed and in lower case. */
  abstract findCredentialsByEmail(email: string): Promise<PlayerCredentials | null>;
}
