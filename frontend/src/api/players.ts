import { request } from './client'

/** A player as returned by the API, times are ISO 8601 strings. */
export interface Player {
  id: string
  nickname: string
  createdAt: string
  updatedAt: string
}

/** A player in the list of all players: only id and nickname. */
export interface PlayerListItem {
  id: string
  nickname: string
}

/** The logged-in player, the only one whose email the API returns. */
export interface MyPlayer extends Player {
  email: string
}

export function registerPlayer(
  email: string,
  nickname: string,
  password: string,
): Promise<{ id: string }> {
  return request<{ id: string }>('POST', '/v1/players', { email, nickname, password })
}

export async function listPlayers(): Promise<PlayerListItem[]> {
  return (await request<{ players: PlayerListItem[] }>('GET', '/v1/players')).players
}

export function getMe(): Promise<MyPlayer> {
  return request<MyPlayer>('GET', '/v1/players/me')
}

export function getPlayer(id: string): Promise<Player> {
  return request<Player>('GET', `/v1/players/${encodeURIComponent(id)}`)
}

export function changeMyNickname(nickname: string): Promise<void> {
  return request<void>('PATCH', '/v1/players/me', { nickname })
}
