import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { SeasonQueries } from '../../application/ports/season-queries.port.js';
import type { DriverReadModel, RaceReadModel } from '../../application/season.read-model.js';

const RACE_COLUMNS =
  'id, season, round, name, circuit, locality, country, sprint_qualifying_at, qualifying_at, race_at';

/** Rows as plain SQL returns them. MikroORM returns timestamps of raw queries as strings. */
interface RaceRow {
  id: string;
  season: number;
  round: number;
  name: string;
  circuit: string;
  locality: string;
  country: string;
  sprint_qualifying_at: string | null;
  qualifying_at: string;
  race_at: string;
}

interface DriverRow {
  id: string;
  code: string;
  number: number;
  first_name: string;
  last_name: string;
  team_id: string | null;
  team_name: string | null;
}

/** Read side of races and drivers: plain SQL straight into the read models, without the Season aggregate. */
@Injectable()
export class SqlSeasonQueries implements SeasonQueries {
  constructor(private readonly em: EntityManager) {}

  async listRaces(season: number): Promise<RaceReadModel[]> {
    const rows = await this.em
      .getConnection()
      .execute<RaceRow[]>(`select ${RACE_COLUMNS} from races where season = ? order by round`, [season]);
    return rows.map(toRace);
  }

  async findRace(id: string): Promise<RaceReadModel | null> {
    const [row] = await this.em
      .getConnection()
      .execute<RaceRow[]>(`select ${RACE_COLUMNS} from races where id = ?`, [id]);
    return row === undefined ? null : toRace(row);
  }

  async listDrivers(season: number): Promise<DriverReadModel[]> {
    const rows = await this.em
      .getConnection()
      .execute<DriverRow[]>(
        'select id, code, number, first_name, last_name, team_id, team_name from season_drivers where season = ? order by code, id',
        [season],
      );
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      number: row.number,
      firstName: row.first_name,
      lastName: row.last_name,
      team: row.team_id !== null && row.team_name !== null ? { id: row.team_id, name: row.team_name } : null,
    }));
  }
}

function toRace(row: RaceRow): RaceReadModel {
  return {
    id: row.id,
    season: row.season,
    round: row.round,
    name: row.name,
    circuit: row.circuit,
    locality: row.locality,
    country: row.country,
    sprintQualifyingAt: row.sprint_qualifying_at === null ? null : new Date(row.sprint_qualifying_at),
    qualifyingAt: new Date(row.qualifying_at),
    raceAt: new Date(row.race_at),
  };
}
