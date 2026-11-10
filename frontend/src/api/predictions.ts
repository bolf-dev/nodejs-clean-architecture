import { ApiError, request } from './client'

/** The driver codes of a prediction, e.g. `{ pole: 'NOR', p1: 'VER', p2: 'NOR', p3: 'LEC' }`. */
export interface Picks {
  pole: string
  p1: string
  p2: string
  p3: string
}

/** A prediction as returned by the API, times are ISO 8601 strings. */
export interface Prediction extends Picks {
  raceId: string
  submittedAt: string
  updatedAt: string
}

export function submitMyPrediction(raceId: string, picks: Picks): Promise<void> {
  return request<void>('PUT', `/v1/races/${encodeURIComponent(raceId)}/predictions/me`, picks)
}

/** My prediction for the race, or null when I have not predicted it yet. */
export async function getMyPrediction(raceId: string): Promise<Prediction | null> {
  try {
    return await request<Prediction>('GET', `/v1/races/${encodeURIComponent(raceId)}/predictions/me`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/** A prediction in the list of a player's predictions, with the race it is for. */
export interface PlayerPrediction extends Prediction {
  round: number
  raceName: string
}

/** The predictions of a player in a season that I may see, ordered by round. */
export async function listPlayerPredictions(
  playerId: string,
  season: number,
): Promise<PlayerPrediction[]> {
  return (
    await request<{ predictions: PlayerPrediction[] }>(
      'GET',
      `/v1/players/${encodeURIComponent(playerId)}/predictions?season=${season}`,
    )
  ).predictions
}
