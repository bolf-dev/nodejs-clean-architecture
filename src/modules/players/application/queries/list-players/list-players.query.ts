import { Query } from '@nestjs/cqrs';
import type { PlayerListItem } from '../../player.read-model.js';

/** Get every player of the league, ordered by nickname. */
export class ListPlayersQuery extends Query<PlayerListItem[]> {}
