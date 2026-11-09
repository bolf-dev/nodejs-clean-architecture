import type { PlayerReadModel } from '../../application/player.read-model.js';

/** Body of GET /v1/players/me: the logged-in player, the only response with the email (R4 of spec 004). */
export class MyPlayerResponse {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly nickname: string,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(player: PlayerReadModel): MyPlayerResponse {
    return new MyPlayerResponse(
      player.id,
      player.email,
      player.nickname,
      player.createdAt.toISOString(),
      player.updatedAt.toISOString(),
    );
  }
}
