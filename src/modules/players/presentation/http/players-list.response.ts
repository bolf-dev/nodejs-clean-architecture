import type { PlayerListItem } from '../../application/player.read-model.js';

/**
 * Body of GET /v1/players: id and nickname only, never the email (R3 of spec 005).
 * The list is wrapped in an object, so fields like paging can be added later.
 */
export class PlayersListResponse {
  constructor(readonly players: PlayerListItem[]) {}

  static from(players: PlayerListItem[]): PlayersListResponse {
    return new PlayersListResponse(players.map(({ id, nickname }) => ({ id, nickname })));
  }
}
