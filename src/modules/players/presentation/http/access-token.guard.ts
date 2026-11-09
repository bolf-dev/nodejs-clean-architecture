import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import type { AuthenticatedRequest } from '../../../../shared/presentation/http/current-player-id.decorator.js';
import { IS_PUBLIC } from '../../../../shared/presentation/http/public.decorator.js';
import { AuthenticationRequired } from '../../application/player.errors.js';
import { AuthenticateQuery } from '../../application/queries/authenticate/authenticate.query.js';

/**
 * Global guard (APP_GUARD): every endpoint of every module needs a valid access token,
 * except the ones marked @Public(). It puts the logged-in player's id on the request for @CurrentPlayerId().
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly queryBus: QueryBus,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, accessToken] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !accessToken) {
      throw new AuthenticationRequired();
    }

    request.playerId = await this.queryBus.execute(new AuthenticateQuery(accessToken));
    return true;
  }
}
