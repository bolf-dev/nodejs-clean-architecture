import { request } from './client'

/** A race as returned by the API, times are ISO 8601 strings in UTC. */
export interface Race {
  id: string
  season: number
  round: number
  name: string
  circuit: string
  locality: string
  country: string
  /** Only on sprint weekends */
  sprintQualifyingAt: string | null
  qualifyingAt: string
  raceAt: string
}

/** A driver of the current grid of a season. */
export interface Driver {
  id: string
  code: string
  number: number
  firstName: string
  lastName: string
  /** Unknown before the first race of a season */
  team: { id: string; name: string } | null
}

export async function listRaces(season: number): Promise<Race[]> {
  return (await request<{ races: Race[] }>('GET', `/v1/races?season=${season}`)).races
}

export function getRace(id: string): Promise<Race> {
  return request<Race>('GET', `/v1/races/${encodeURIComponent(id)}`)
}

export async function listDrivers(season: number): Promise<Driver[]> {
  return (await request<{ drivers: Driver[] }>('GET', `/v1/drivers?season=${season}`)).drivers
}
