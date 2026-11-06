import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { ChangeNicknameCommand } from '../../application/commands/change-nickname/change-nickname.command.js';
import { RegisterPlayerCommand } from '../../application/commands/register-player/register-player.command.js';
import { GetPlayerQuery } from '../../application/queries/get-player/get-player.query.js';
import { ChangeNicknameRequest } from './change-nickname.request.js';
import { PlayerResponse } from './player.response.js';
import { RegisterPlayerRequest } from './register-player.request.js';

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
  async register(
    @Body() request: RegisterPlayerRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ id: string }> {
    const { id } = await this.commandBus.execute(
      new RegisterPlayerCommand(request.email, request.nickname, request.password),
    );
    response.location(`/v1/players/${id}`);
    return { id };
  }

  @Get(':playerId')
  async get(@Param('playerId', playerIdPipe) playerId: string): Promise<PlayerResponse> {
    const player = await this.queryBus.execute(new GetPlayerQuery(playerId));
    return PlayerResponse.from(player);
  }

  @Patch(':playerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeNickname(
    @Param('playerId', playerIdPipe) playerId: string,
    @Body() request: ChangeNicknameRequest,
  ): Promise<void> {
    await this.commandBus.execute(new ChangeNicknameCommand(playerId, request.nickname));
  }
}
