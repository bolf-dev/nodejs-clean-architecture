const GENERIC_ERROR = 'Something went wrong. Please try again.'

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
  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, GENERIC_ERROR)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
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
