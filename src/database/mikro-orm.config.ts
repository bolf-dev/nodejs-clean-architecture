import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, type Options } from '@mikro-orm/postgresql';
import { PlayerRecord } from '../modules/players/infrastructure/persistence/player.record.js';

/**
 * MikroORM configuration shared by the app (AppModule) and the MikroORM CLI (migrations).
 */
export function createMikroOrmConfig(databaseUrl: string): Options {
  return defineConfig({
    clientUrl: databaseUrl,
    entities: [PlayerRecord],
    extensions: [Migrator],
    migrations: {
      path: 'dist/database/migrations',
      pathTs: 'src/database/migrations',
    },
  });
}

// Entry point for the MikroORM CLI, which reads the connection from the environment
export default createMikroOrmConfig(process.env.DATABASE_URL ?? '');
