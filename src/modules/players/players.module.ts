import { Module } from '@nestjs/common';
import { ChangeNicknameHandler } from './application/commands/change-nickname/change-nickname.handler.js';
import { RegisterPlayerHandler } from './application/commands/register-player/register-player.handler.js';
import { PasswordHasher } from './application/ports/password-hasher.port.js';
import { PlayerQueries } from './application/ports/player-queries.port.js';
import { GetPlayerHandler } from './application/queries/get-player/get-player.handler.js';
import { PlayerRepository } from './domain/player.repository.port.js';
import { MikroOrmPlayerRepository } from './infrastructure/persistence/mikro-orm-player.repository.js';
import { SqlPlayerQueries } from './infrastructure/persistence/sql-player-queries.js';
import { ScryptPasswordHasher } from './infrastructure/security/scrypt-password-hasher.js';
import { PlayersController } from './presentation/http/players.controller.js';

@Module({
  controllers: [PlayersController],
  providers: [
    RegisterPlayerHandler,
    ChangeNicknameHandler,
    GetPlayerHandler,
    // Whoever asks for a port gets its implementation
    { provide: PlayerRepository, useClass: MikroOrmPlayerRepository },
    { provide: PlayerQueries, useClass: SqlPlayerQueries },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
  ],
})
export class PlayersModule {}
