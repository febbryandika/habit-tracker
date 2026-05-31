import { createMiddleware } from 'hono/factory'
import { auth } from './auth'
import { apiError, ErrorCode } from './errors'
import { logger } from './logger'

type SessionUser = typeof auth.$Infer.Session.user
type SessionData = typeof auth.$Infer.Session.session

export const requestLogger = createMiddleware(async (c, next) => {
  await next()
  logger.info('request', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
  })
})

// Gates a route behind a valid better-auth session and puts the user on context.
// Used by /api/me and the habit/log routes added in later steps.
export const requireAuth = createMiddleware<{
  Variables: { user: SessionUser; session: SessionData }
}>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return apiError(c, 401, 'Unauthorized', ErrorCode.UNAUTHORIZED)
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})
