import { Module } from '@nestjs/common';
import { SyncSeasonHandler } from './application/commands/sync-season/sync-season.handler.js';
import { F1DataProvider } from './application/ports/f1-data-provider.port.js';
import { SeasonRepository } from './domain/season.repository.port.js';
import { JolpicaF1DataProvider } from './infrastructure/jolpica/jolpica-f1-data-provider.js';
import { MikroOrmSeasonRepository } from './infrastructure/persistence/mikro-orm-season.repository.js';

@Module({
  providers: [
    SyncSeasonHandler,
    // Whoever asks for a port gets its implementation
    { provide: SeasonRepository, useClass: MikroOrmSeasonRepository },
    { provide: F1DataProvider, useClass: JolpicaF1DataProvider },
  ],
})
export class SeasonsModule {}
