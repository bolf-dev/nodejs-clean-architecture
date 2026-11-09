import { Injectable } from '@nestjs/common';
import { type F1Driver, F1DataProvider } from '../../application/ports/f1-data-provider.port.js';
import { F1DataUnavailable } from '../../application/season.errors.js';
import type { RaceData } from '../../domain/race.entity.js';
import type { GridDriverData } from '../../domain/season-driver.entity.js';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

/** The parts of the Jolpica JSON the app reads. Every field is optional, because the response is not trusted. */
interface JolpicaSession {
  date?: string;
  time?: string;
}

interface JolpicaDriver {
  driverId?: string;
  code?: string;
  permanentNumber?: string;
  givenName?: string;
  familyName?: string;
}

interface JolpicaResult {
  number?: string;
  Driver?: JolpicaDriver;
  Constructor?: { constructorId?: string; name?: string };
}

interface JolpicaRace extends JolpicaSession {
  round?: string;
  raceName?: string;
  Circuit?: { circuitName?: string; Location?: { locality?: string; country?: string } };
  Qualifying?: JolpicaSession;
  SprintQualifying?: JolpicaSession;
  Results?: JolpicaResult[];
}

interface JolpicaResponse {
  MRData?: {
    RaceTable?: { Races?: JolpicaRace[] };
    DriverTable?: { Drivers?: JolpicaDriver[] };
  };
}

/** F1DataProvider adapter for the public Jolpica F1 API (the successor of the Ergast API). */
@Injectable()
export class JolpicaF1DataProvider implements F1DataProvider {
  async calendar(year: number): Promise<RaceData[]> {
    const response = await this.get(`/${year}.json?limit=100`);
    return list(response.MRData?.RaceTable?.Races, 'races').map(toRaceData);
  }

  async latestRaceStarters(year: number): Promise<GridDriverData[]> {
    const response = await this.get(`/${year}/last/results.json?limit=100`);
    const [race] = list(response.MRData?.RaceTable?.Races, 'races');
    return race === undefined ? [] : list(race.Results, 'results').map(toGridDriver);
  }

  async seasonDrivers(year: number): Promise<F1Driver[]> {
    const response = await this.get(`/${year}/drivers.json?limit=100`);
    return list(response.MRData?.DriverTable?.Drivers, 'drivers').map((driver) => ({
      externalId: text(driver.driverId, 'driver id'),
      code: driver.code ?? null,
      number: driver.permanentNumber === undefined ? null : integer(driver.permanentNumber, 'driver number'),
      firstName: text(driver.givenName, 'driver first name'),
      lastName: text(driver.familyName, 'driver last name'),
    }));
  }

  private async get(path: string): Promise<JolpicaResponse> {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${path}`);
    } catch (error) {
      throw new F1DataUnavailable(`Jolpica F1 API cannot be reached: ${(error as Error).message}`);
    }
    if (!response.ok) {
      throw new F1DataUnavailable(`Jolpica F1 API answered ${response.status} for ${path}`);
    }
    try {
      return (await response.json()) as JolpicaResponse;
    } catch {
      throw new F1DataUnavailable(`Jolpica F1 API returned invalid JSON for ${path}`);
    }
  }
}

function toRaceData(race: JolpicaRace): RaceData {
  return {
    round: integer(race.round, 'round'),
    name: text(race.raceName, 'race name'),
    circuit: text(race.Circuit?.circuitName, 'circuit'),
    locality: text(race.Circuit?.Location?.locality, 'locality'),
    country: text(race.Circuit?.Location?.country, 'country'),
    sprintQualifyingAt: race.SprintQualifying ? utc(race.SprintQualifying, 'sprint qualifying') : null,
    qualifyingAt: utc(race.Qualifying, 'qualifying'),
    raceAt: utc(race, 'race'),
  };
}

function toGridDriver(result: JolpicaResult): GridDriverData {
  return {
    externalId: text(result.Driver?.driverId, 'driver id'),
    code: result.Driver?.code ?? null,
    // The car number of the race, also for drivers without a permanent number
    number: integer(result.number, 'driver number'),
    firstName: text(result.Driver?.givenName, 'driver first name'),
    lastName: text(result.Driver?.familyName, 'driver last name'),
    team: {
      id: text(result.Constructor?.constructorId, 'team id'),
      name: text(result.Constructor?.name, 'team name'),
    },
  };
}

// A missing or malformed field makes the whole response unreadable, so nothing is synced (R3)

function list<T>(value: T[] | undefined, what: string): T[] {
  if (!Array.isArray(value)) {
    throw new F1DataUnavailable(`Jolpica F1 API response has no list of ${what}`);
  }
  return value;
}

function text(value: string | undefined, what: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new F1DataUnavailable(`Jolpica F1 API response has no ${what}`);
  }
  return value;
}

function integer(value: string | undefined, what: string): number {
  const number = Number(text(value, what));
  if (!Number.isInteger(number)) {
    throw new F1DataUnavailable(`Jolpica F1 API response has an invalid ${what}: ${value}`);
  }
  return number;
}

/** Jolpica gives a session as a date and a UTC time, e.g. `2026-03-08` and `04:00:00Z` (R6). */
function utc(session: JolpicaSession | undefined, what: string): Date {
  const date = new Date(`${text(session?.date, `${what} date`)}T${text(session?.time, `${what} time`)}`);
  if (Number.isNaN(date.getTime())) {
    throw new F1DataUnavailable(`Jolpica F1 API response has an invalid ${what} time`);
  }
  return date;
}
