import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Public } from '../../../../shared/presentation/http/public.decorator.js';
import { LogInQuery } from '../../application/queries/log-in/log-in.query.js';
import { LogInRequest } from './log-in.request.js';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly queryBus: QueryBus) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async logIn(@Body() request: LogInRequest): Promise<{ accessToken: string; expiresAt: string }> {
    const { accessToken, expiresAt } = await this.queryBus.execute(new LogInQuery(request.email, request.password));
    return { accessToken, expiresAt: expiresAt.toISOString() };
  }
}
