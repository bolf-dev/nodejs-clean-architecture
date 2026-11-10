import { PlayerDirectory } from '../../application/ports/player-directory.port.js';

/** PlayerDirectory adapter with players set by the test, used by unit tests instead of the players module. */
export class FakePlayerDirectory implements PlayerDirectory {
  readonly playerIds = new Set<string>();

  async exists(playerId: string): Promise<boolean> {
    return this.playerIds.has(playerId);
  }
}
