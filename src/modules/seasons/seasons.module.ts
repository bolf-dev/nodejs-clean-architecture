import { Module } from '@nestjs/common';
import { SyncSeasonHandler } from './application/commands/sync-season/sync-season.handler.js';
import { F1DataProvider } from './application/ports/f1-data-provider.port.js';
import { SeasonQueries } from './application/ports/season-queries.port.js';
import { GetRaceHandler } from './application/queries/get-race/get-race.handler.js';
import { ListDriversHandler } from './application/queries/list-drivers/list-drivers.handler.js';
import { ListRacesHandler } from './application/queries/list-races/list-races.handler.js';
import { SeasonRepository } from './domain/season.repository.port.js';
import { JolpicaF1DataProvider } from './infrastructure/jolpica/jolpica-f1-data-provider.js';
import { MikroOrmSeasonRepository } from './infrastructure/persistence/mikro-orm-season.repository.js';
import { SqlSeasonQueries } from './infrastructure/persistence/sql-season-queries.js';
import { DriversController } from './presentation/http/drivers.controller.js';
import { RacesController } from './presentation/http/races.controller.js';

@Module({
  controllers: [RacesController, DriversController],
  providers: [
    SyncSeasonHandler,
    ListRacesHandler,
    GetRaceHandler,
    ListDriversHandler,
    // Whoever asks for a port gets its implementation
    { provide: SeasonRepository, useClass: MikroOrmSeasonRepository },
    { provide: SeasonQueries, useClass: SqlSeasonQueries },
    { provide: F1DataProvider, useClass: JolpicaF1DataProvider },
  ],
})
export class SeasonsModule {}
