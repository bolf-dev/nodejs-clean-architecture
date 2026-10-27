import { Body, Controller, Post, Res } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { CreatePlayerCommand } from '../../application/commands/create-player/create-player.command.js';
import { CreatePlayerRequest } from './create-player.request.js';

@Controller('v1/players')
export class PlayersController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(
    @Body() request: CreatePlayerRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ id: string }> {
    const { id } = await this.commandBus.execute(new CreatePlayerCommand(request.nickname));
    response.location(`/v1/players/${id}`);
    return { id };
  }
}
