import { request } from './client'

/** A player as returned by the API, times are ISO 8601 strings. */
export interface Player {
  id: string
  nickname: string
  createdAt: string
  updatedAt: string
}

export function createPlayer(nickname: string): Promise<{ id: string }> {
  return request<{ id: string }>('POST', '/v1/players', { nickname })
}

export function getPlayer(id: string): Promise<Player> {
  return request<Player>('GET', `/v1/players/${encodeURIComponent(id)}`)
}

export function changeNickname(id: string, nickname: string): Promise<void> {
  return request<void>('PATCH', `/v1/players/${encodeURIComponent(id)}`, { nickname })
}
