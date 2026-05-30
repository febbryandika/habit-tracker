// Typed API error carrying the HTTP status + machine `code` from the backend's
// standardized error body, so callers (forms, dialogs) and the global 401
// handler can branch on them instead of parsing strings.
export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type ErrorResponse = { status: number; json(): Promise<unknown> }

function readString(body: unknown, key: string): string | undefined {
  if (body && typeof body === 'object' && key in body) {
    const value = (body as Record<string, unknown>)[key]
    if (typeof value === 'string') return value
  }
  return undefined
}

// Reads the standardized `{ error, code }` body and throws a typed ApiError.
// Falls back to a generic message for non-JSON responses.
export async function throwApiError(res: ErrorResponse): Promise<never> {
  let message = 'Something went wrong'
  let code: string | undefined
  try {
    const body = await res.json()
    message = readString(body, 'error') ?? message
    code = readString(body, 'code')
  } catch {
    // non-JSON response; keep the default message
  }
  throw new ApiError(message, res.status, code)
}
