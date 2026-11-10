import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentPlayerId } from '../../../../shared/presentation/http/current-player-id.decorator.js';
import { SeasonRequest } from '../../../../shared/presentation/http/season.request.js';
import { ListPlayerPredictionsQuery } from '../../application/queries/list-player-predictions/list-player-predictions.query.js';
import { PlayerPredictionsResponse } from './player-predictions.response.js';

const playerIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException('playerId must be a UUID'),
});

@Controller('v1/players/:playerId/predictions')
export class PlayerPredictionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(
    @CurrentPlayerId() viewerId: string,
    @Param('playerId', playerIdPipe) playerId: string,
    @Query() request: SeasonRequest,
  ): Promise<PlayerPredictionsResponse> {
    return PlayerPredictionsResponse.from(
      await this.queryBus.execute(new ListPlayerPredictionsQuery(viewerId, playerId, Number(request.season))),
    );
  }
}
