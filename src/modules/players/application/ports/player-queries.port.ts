import type { PlayerReadModel } from '../player.read-model.js';

/** Port for reading players on the read side, implemented in infrastructure. */
export abstract class PlayerQueries {
  abstract findById(id: string): Promise<PlayerReadModel | null>;
}
