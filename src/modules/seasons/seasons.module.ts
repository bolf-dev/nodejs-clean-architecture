import { Module } from '@nestjs/common';
import { SeasonRepository } from './domain/season.repository.port.js';
import { MikroOrmSeasonRepository } from './infrastructure/persistence/mikro-orm-season.repository.js';

@Module({
  providers: [
    // Whoever asks for a port gets its implementation
    { provide: SeasonRepository, useClass: MikroOrmSeasonRepository },
  ],
})
export class SeasonsModule {}
