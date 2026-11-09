const STORAGE_KEY = 'f1-prediction-league.access-token'

/** The access token of the logged-in player, as returned by the login endpoint. */
export interface StoredToken {
  accessToken: string
  expiresAt: string
}

/**
 * The stored token, or null when there is none. An expired token is still returned:
 * the API rejects it with 401, and the login screen then says the session has expired.
 */
export function readToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : (JSON.parse(raw) as StoredToken)
  } catch {
    // Storage blocked or broken content: behave as logged out
    return null
  }
}

export function saveToken(token: StoredToken): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
  } catch {
    // Storage blocked: the player stays logged in only until the page is reloaded
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored
  }
}
