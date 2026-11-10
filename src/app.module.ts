import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { validateEnvironment, type Environment } from './config/environment.js';
import { createMikroOrmConfig } from './database/mikro-orm.config.js';
import { PlayersModule } from './modules/players/players.module.js';
import { PredictionsModule } from './modules/predictions/predictions.module.js';
import { SeasonsModule } from './modules/seasons/seasons.module.js';
import { ErrorResponseFilter } from './shared/presentation/http/error-response.filter.js';
import { RequestValidationPipe } from './shared/presentation/http/validation.pipe.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) =>
        createMikroOrmConfig(config.get('DATABASE_URL', { infer: true })),
    }),
    CqrsModule.forRoot(),
    PlayersModule,
    SeasonsModule,
    PredictionsModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: RequestValidationPipe },
    { provide: APP_FILTER, useClass: ErrorResponseFilter },
  ],
})
export class AppModule {}
