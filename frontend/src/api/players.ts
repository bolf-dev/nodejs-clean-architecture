import { request } from './client'

/** A player as returned by the API, times are ISO 8601 strings. */
export interface Player {
  id: string
  nickname: string
  createdAt: string
  updatedAt: string
}

export function getPlayer(id: string): Promise<Player> {
  return request<Player>('GET', `/v1/players/${encodeURIComponent(id)}`)
}
