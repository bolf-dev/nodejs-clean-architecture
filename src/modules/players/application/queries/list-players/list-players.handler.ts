import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { PlayerListItem } from '../../player.read-model.js';
import { PlayerQueries } from '../../ports/player-queries.port.js';
import { ListPlayersQuery } from './list-players.query.js';

@QueryHandler(ListPlayersQuery)
export class ListPlayersHandler implements IQueryHandler<ListPlayersQuery> {
  constructor(private readonly playerQueries: PlayerQueries) {}

  execute(): Promise<PlayerListItem[]> {
    return this.playerQueries.listAll();
  }
}
