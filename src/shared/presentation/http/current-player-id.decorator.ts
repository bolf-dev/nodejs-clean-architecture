import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** A request with the id of the logged-in player, set by the access token guard. */
export interface AuthenticatedRequest extends Request {
  playerId?: string;
}

/** The id of the logged-in player, for endpoints acting on behalf of the player. */
export const CurrentPlayerId = createParamDecorator((_: unknown, context: ExecutionContext): string => {
  const { playerId } = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (playerId === undefined) {
    // A programming error: the endpoint is @Public(), so the guard did not run
    throw new Error('@CurrentPlayerId() is used on an endpoint without an access token');
  }
  return playerId;
});
