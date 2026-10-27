import { Query } from '@nestjs/cqrs';
import type { PlayerReadModel } from '../../player.read-model.js';

/** Get one player by id. */
export class GetPlayerQuery extends Query<PlayerReadModel> {
  constructor(readonly playerId: string) {
    super();
  }
}
