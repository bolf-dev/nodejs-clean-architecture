import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { Season } from '../../domain/season.aggregate.js';
import { SeasonRepository } from '../../domain/season.repository.port.js';
import { RaceRecord } from './race.record.js';
import { SeasonDriverRecord } from './season-driver.record.js';
import { SeasonMapper } from './season.mapper.js';

@Injectable()
export class MikroOrmSeasonRepository implements SeasonRepository {
  constructor(private readonly em: EntityManager) {}

  async findByYear(year: number): Promise<Season | null> {
    const races = await this.em.find(RaceRecord, { season: year });
    const drivers = await this.em.find(SeasonDriverRecord, { season: year });

    if (races.length === 0 && drivers.length === 0) {
      return null;
    }
    return SeasonMapper.toDomain(year, races, drivers);
  }

  async save(season: Season): Promise<void> {
    const races = SeasonMapper.toRaceRecords(season);
    const drivers = SeasonMapper.toDriverRecords(season);

    await this.em.transactional(async (em) => {
      if (races.length > 0) {
        await em.upsertMany(RaceRecord, races);
      }
      // Drivers who left the grid are no longer drivers of the season (R9)
      await em.nativeDelete(SeasonDriverRecord, {
        season: season.year,
        id: { $nin: drivers.map(({ id }) => id) },
      });
      if (drivers.length > 0) {
        await em.upsertMany(SeasonDriverRecord, drivers);
      }
    });
  }
}
