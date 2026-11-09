import { readToken } from '@/auth/token-storage'

export const GENERIC_ERROR = 'Something went wrong. Please try again.'

/** An error response from the API, or status 0 when the API cannot be reached. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const token = readToken()
  if (token !== null) {
    headers['Authorization'] = `Bearer ${token.accessToken}`
  }

  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, GENERIC_ERROR)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
  }

  // 204 No Content has no body to parse
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/** The `error` message of the API body; server errors and unexpected bodies get the generic one. */
async function errorMessage(response: Response): Promise<string> {
  if (response.status >= 500) {
    return GENERIC_ERROR
  }

  try {
    const body: unknown = await response.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
    ) {
      return body.error
    }
  } catch {
    // Not JSON, fall through to the generic message
  }

  return GENERIC_ERROR
}
