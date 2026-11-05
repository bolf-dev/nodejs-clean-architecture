import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

/** Runs a SQL query against the app's database. */
export function query<T>(app: INestApplication, sql: string, params: unknown[] = []): Promise<T[]> {
  return app.get(MikroORM).em.getConnection().execute<T[]>(sql, params);
}

/** Empties every table except the migrations table, so each test starts from an empty database. */
export async function clearDatabase(app: INestApplication): Promise<void> {
  const tables = await query<{ tablename: string }>(
    app,
    "select tablename from pg_tables where schemaname = 'public' and tablename <> 'mikro_orm_migrations'",
  );
  if (tables.length > 0) {
    await query(app, `truncate ${tables.map(({ tablename }) => `"${tablename}"`).join(', ')}`);
  }
}
