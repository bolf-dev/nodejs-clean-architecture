import type { PlayerReadModel } from '../../application/player.read-model.js';

/** Body of GET /v1/players/{playerId}. Times are ISO 8601 strings in UTC. */
export class PlayerResponse {
  constructor(
    readonly id: string,
    readonly nickname: string,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(player: PlayerReadModel): PlayerResponse {
    return new PlayerResponse(
      player.id,
      player.nickname,
      player.createdAt.toISOString(),
      player.updatedAt.toISOString(),
    );
  }
}
