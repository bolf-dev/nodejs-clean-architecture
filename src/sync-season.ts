import { MikroORM, RequestContext } from '@mikro-orm/postgresql';
import { NestFactory } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { AppModule } from './app.module.js';
import { SyncSeasonCommand } from './modules/seasons/application/commands/sync-season/sync-season.command.js';

/**
 * Command line entry point: `node dist/sync-season.js 2026` loads or updates a season (R1).
 * It starts the app without HTTP, so only the project owner can sync, never a player.
 */
async function syncSeason(): Promise<void> {
  const year = process.argv[2] ?? '';
  if (!/^\d{4}$/.test(year)) {
    process.stderr.write('Usage: make sync-season year=2026\n');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    // Outside an HTTP request MikroORM needs its own context, which a request gets from its middleware
    const summary = await RequestContext.create(app.get(MikroORM).em, () =>
      app.get(CommandBus).execute(new SyncSeasonCommand(Number(year))),
    );
    process.stdout.write(
      `${year}: ${summary.races} races (${summary.created} new, ${summary.updated} updated), ${summary.drivers} drivers\n`,
    );
  } catch (error) {
    process.stderr.write(`Sync of ${year} failed, nothing was changed: ${(error as Error).message}\n`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}
await syncSeason();
