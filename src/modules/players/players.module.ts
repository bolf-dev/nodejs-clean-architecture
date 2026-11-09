import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import type { Environment } from '../../config/environment.js';
import { ChangeNicknameHandler } from './application/commands/change-nickname/change-nickname.handler.js';
import { RegisterPlayerHandler } from './application/commands/register-player/register-player.handler.js';
import { PasswordHasher } from './application/ports/password-hasher.port.js';
import { PlayerQueries } from './application/ports/player-queries.port.js';
import { TokenService } from './application/ports/token-service.port.js';
import { AuthenticateHandler } from './application/queries/authenticate/authenticate.handler.js';
import { GetPlayerHandler } from './application/queries/get-player/get-player.handler.js';
import { ListPlayersHandler } from './application/queries/list-players/list-players.handler.js';
import { LogInHandler } from './application/queries/log-in/log-in.handler.js';
import { PlayerRepository } from './domain/player.repository.port.js';
import { MikroOrmPlayerRepository } from './infrastructure/persistence/mikro-orm-player.repository.js';
import { SqlPlayerQueries } from './infrastructure/persistence/sql-player-queries.js';
import { JwtTokenService } from './infrastructure/security/jwt-token-service.js';
import { ScryptPasswordHasher } from './infrastructure/security/scrypt-password-hasher.js';
import { AccessTokenGuard } from './presentation/http/access-token.guard.js';
import { AuthController } from './presentation/http/auth.controller.js';
import { PlayersController } from './presentation/http/players.controller.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
      }),
    }),
  ],
  controllers: [PlayersController, AuthController],
  providers: [
    RegisterPlayerHandler,
    ChangeNicknameHandler,
    GetPlayerHandler,
    ListPlayersHandler,
    LogInHandler,
    AuthenticateHandler,
    // Every endpoint of every module needs an access token, unless it is @Public()
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    // Whoever asks for a port gets its implementation
    { provide: PlayerRepository, useClass: MikroOrmPlayerRepository },
    { provide: PlayerQueries, useClass: SqlPlayerQueries },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
    { provide: TokenService, useClass: JwtTokenService },
  ],
})
export class PlayersModule {}
