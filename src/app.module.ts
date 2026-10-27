import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnvironment, type Environment } from './config/environment.js';
import { createMikroOrmConfig } from './database/mikro-orm.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) =>
        createMikroOrmConfig(config.get('DATABASE_URL', { infer: true })),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
