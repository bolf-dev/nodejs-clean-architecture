import { Module } from '@nestjs/common';
import { CreatePlayerHandler } from './application/commands/create-player/create-player.handler.js';
import { PlayerRepository } from './domain/player.repository.port.js';
import { MikroOrmPlayerRepository } from './infrastructure/persistence/mikro-orm-player.repository.js';
import { PlayersController } from './presentation/http/players.controller.js';

@Module({
  controllers: [PlayersController],
  providers: [
    CreatePlayerHandler,
    // Whoever asks for the PlayerRepository port gets the MikroORM implementation
    { provide: PlayerRepository, useClass: MikroOrmPlayerRepository },
  ],
})
export class PlayersModule {}
