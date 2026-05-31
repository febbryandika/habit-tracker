import { rateLimiter } from 'hono-rate-limiter'
import { getConnInfo } from 'hono/bun'
import { apiError, ErrorCode } from './errors'

// Throttles credential-submitting POSTs (sign-in, sign-up) to slow brute-force.
// GET /api/auth/get-session and POST /api/auth/sign-out are excluded so normal
// app usage never trips the limit.
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15-minute fixed window
  limit: 10,
  keyGenerator: (c) => {
    const forwarded = c.req.header('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    try {
      return getConnInfo(c).remote.address ?? 'anonymous'
    } catch {
      return 'anonymous'
    }
  },
  // Only count credential POSTs; leave session checks and sign-out unthrottled.
  skip: (c) => c.req.method !== 'POST' || c.req.path.endsWith('/sign-out'),
  standardHeaders: 'draft-7',
  handler: (c) =>
    apiError(c, 429, 'Too many authentication attempts, please try again later.', ErrorCode.TOO_MANY_REQUESTS),
})
