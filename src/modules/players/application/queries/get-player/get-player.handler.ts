import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PlayerNotFound } from '../../player.errors.js';
import type { PlayerReadModel } from '../../player.read-model.js';
import { PlayerQueries } from '../../ports/player-queries.port.js';
import { GetPlayerQuery } from './get-player.query.js';

@QueryHandler(GetPlayerQuery)
export class GetPlayerHandler implements IQueryHandler<GetPlayerQuery> {
  constructor(private readonly playerQueries: PlayerQueries) {}

  async execute(query: GetPlayerQuery): Promise<PlayerReadModel> {
    const player = await this.playerQueries.findById(query.playerId);
    if (player === null) {
      throw new PlayerNotFound(query.playerId);
    }
    return player;
  }
}
