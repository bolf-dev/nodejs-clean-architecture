import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentPlayerId } from '../../../../shared/presentation/http/current-player-id.decorator.js';
import { SubmitPredictionCommand } from '../../application/commands/submit-prediction/submit-prediction.command.js';
import { GetMyPredictionQuery } from '../../application/queries/get-my-prediction/get-my-prediction.query.js';
import { PredictionResponse } from './prediction.response.js';
import { SubmitPredictionRequest } from './submit-prediction.request.js';

const raceIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException('raceId must be a UUID'),
});

@Controller('v1/races/:raceId/predictions')
export class RacePredictionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async submitMine(
    @CurrentPlayerId() playerId: string,
    @Param('raceId', raceIdPipe) raceId: string,
    @Body() request: SubmitPredictionRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new SubmitPredictionCommand(playerId, raceId, request.pole, request.p1, request.p2, request.p3),
    );
  }

  @Get('me')
  async getMine(
    @CurrentPlayerId() playerId: string,
    @Param('raceId', raceIdPipe) raceId: string,
  ): Promise<PredictionResponse> {
    return PredictionResponse.from(await this.queryBus.execute(new GetMyPredictionQuery(playerId, raceId)));
  }
}
