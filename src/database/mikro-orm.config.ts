import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, type Options } from '@mikro-orm/postgresql';
import { PlayerRecord } from '../modules/players/infrastructure/persistence/player.record.js';
import { RaceRecord } from '../modules/seasons/infrastructure/persistence/race.record.js';
import { SeasonDriverRecord } from '../modules/seasons/infrastructure/persistence/season-driver.record.js';

/**
 * MikroORM configuration shared by the app (AppModule) and the MikroORM CLI (migrations).
 */
export function createMikroOrmConfig(databaseUrl: string): Options {
  return defineConfig({
    clientUrl: databaseUrl,
    entities: [PlayerRecord, RaceRecord, SeasonDriverRecord],
    extensions: [Migrator],
    migrations: {
      path: 'dist/database/migrations',
      pathTs: 'src/database/migrations',
    },
  });
}

// Entry point for the MikroORM CLI, which reads the connection from the environment
export default createMikroOrmConfig(process.env.DATABASE_URL ?? '');
