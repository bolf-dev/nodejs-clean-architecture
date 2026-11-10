import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PlayerNotFound } from '../../../players/application/player.errors.js';
import { GetPlayerQuery } from '../../../players/application/queries/get-player/get-player.query.js';
import { PlayerDirectory } from '../../application/ports/player-directory.port.js';

/** PlayerDirectory adapter asking the public queries of the players module through the QueryBus. */
@Injectable()
export class QueryBusPlayerDirectory implements PlayerDirectory {
  constructor(private readonly queryBus: QueryBus) {}

  async exists(playerId: string): Promise<boolean> {
    try {
      await this.queryBus.execute(new GetPlayerQuery(playerId));
      return true;
    } catch (error) {
      if (error instanceof PlayerNotFound) {
        return false;
      }
      throw error;
    }
  }
}
