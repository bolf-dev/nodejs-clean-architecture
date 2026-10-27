import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { CreatePlayerCommand } from '../../application/commands/create-player/create-player.command.js';
import { GetPlayerQuery } from '../../application/queries/get-player/get-player.query.js';
import { CreatePlayerRequest } from './create-player.request.js';
import { PlayerResponse } from './player.response.js';

const playerIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException('playerId must be a UUID'),
});

@Controller('v1/players')
export class PlayersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(
    @Body() request: CreatePlayerRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ id: string }> {
    const { id } = await this.commandBus.execute(new CreatePlayerCommand(request.nickname));
    response.location(`/v1/players/${id}`);
    return { id };
  }

  @Get(':playerId')
  async get(@Param('playerId', playerIdPipe) playerId: string): Promise<PlayerResponse> {
    const player = await this.queryBus.execute(new GetPlayerQuery(playerId));
    return PlayerResponse.from(player);
  }
}
