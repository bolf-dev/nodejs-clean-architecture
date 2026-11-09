import { DriverCode } from '../../domain/driver-code.value-object.js';
import { Race } from '../../domain/race.entity.js';
import { SeasonDriver } from '../../domain/season-driver.entity.js';
import { Season } from '../../domain/season.aggregate.js';
import type { RaceRecord } from './race.record.js';
import type { SeasonDriverRecord } from './season-driver.record.js';

/** Converts between the Season aggregate and the rows of the races and season_drivers tables. */
export class SeasonMapper {
  static toRaceRecords(season: Season): RaceRecord[] {
    return season.races.map((race) => ({
      id: race.id,
      season: season.year,
      round: race.round,
      name: race.name,
      circuit: race.circuit,
      locality: race.locality,
      country: race.country,
      sprintQualifyingAt: race.sprintQualifyingAt,
      qualifyingAt: race.qualifyingAt,
      raceAt: race.raceAt,
    }));
  }

  static toDriverRecords(season: Season): SeasonDriverRecord[] {
    return season.drivers.map((driver) => ({
      id: driver.id,
      season: season.year,
      externalId: driver.externalId,
      code: driver.code.value,
      number: driver.number,
      firstName: driver.firstName,
      lastName: driver.lastName,
      teamId: driver.team?.id ?? null,
      teamName: driver.team?.name ?? null,
    }));
  }

  static toDomain(year: number, races: RaceRecord[], drivers: SeasonDriverRecord[]): Season {
    return Season.reconstitute({
      year,
      races: races.map(
        (race) =>
          new Race(race.id, {
            round: race.round,
            name: race.name,
            circuit: race.circuit,
            locality: race.locality,
            country: race.country,
            sprintQualifyingAt: race.sprintQualifyingAt ?? null,
            qualifyingAt: race.qualifyingAt,
            raceAt: race.raceAt,
          }),
      ),
      drivers: drivers.map(
        (driver) =>
          new SeasonDriver(
            driver.id,
            driver.externalId,
            DriverCode.from(driver.code, driver.lastName),
            driver.number,
            driver.firstName,
            driver.lastName,
            driver.teamId && driver.teamName ? { id: driver.teamId, name: driver.teamName } : null,
          ),
      ),
    });
  }
}
