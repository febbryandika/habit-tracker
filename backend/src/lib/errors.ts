import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { zValidator } from '@hono/zod-validator'
import type { z } from 'zod'

// Machine-readable error codes paired with every API error response.
export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

// The single source of truth for the API error body shape. `error` stays a
// human-readable string (the frontend reads it directly); `code` is the stable
// machine key; `issues` carries Zod details on validation failures only.
export type ApiErrorBody = {
  error: string
  code: ErrorCode
  issues?: unknown
}

// Build a standardized error response. Use this everywhere instead of inline
// `c.json({ error }, status)` so the shape is defined in one place.
export function apiError(
  c: Context,
  status: ContentfulStatusCode,
  message: string,
  code: ErrorCode,
  issues?: unknown,
) {
  const body: ApiErrorBody =
    issues === undefined ? { error: message, code } : { error: message, code, issues }
  return c.json(body, status)
}

// Shared zValidator wrapper: emits the standardized validation error on failure.
// `Target` must stay a literal ('json' | 'query'), not widen to the union —
// otherwise Hono RPC infers every route as validating both targets, corrupting
// the typed client (it would demand a bogus `query`/`json` on each call).
export const validate = <Target extends 'json' | 'query', T extends z.ZodType>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return apiError(c, 400, 'Invalid input', ErrorCode.VALIDATION_ERROR, result.error.issues)
    }
  })

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  400: ErrorCode.BAD_REQUEST,
  401: ErrorCode.UNAUTHORIZED,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
}

// Global handler for app.onError: re-emits thrown HTTPExceptions in the standard
// shape, and turns any unexpected throw (DB failure, bug) into a safe 500 JSON
// response — logged server-side, never leaking internals to the client.
export function handleError(err: Error, c: Context) {
  if (err instanceof HTTPException) {
    const code = STATUS_TO_CODE[err.status] ?? ErrorCode.INTERNAL_ERROR
    return apiError(c, err.status, err.message || 'Request failed', code)
  }
  console.error('Unhandled API error:', err)
  return apiError(c, 500, 'Internal server error', ErrorCode.INTERNAL_ERROR)
}
