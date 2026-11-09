const STORAGE_KEY = 'f1-prediction-league.access-token'

/** The access token of the logged-in player, as returned by the login endpoint. */
export interface StoredToken {
  accessToken: string
  expiresAt: string
}

/** The stored token, or null when there is none or it has expired. */
export function readToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return null
    }
    const token = JSON.parse(raw) as StoredToken
    if (new Date(token.expiresAt) <= new Date()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return token
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
