import { createMiddleware } from 'hono/factory'
import { auth } from './auth'
import { apiError, ErrorCode } from './errors'

type SessionUser = typeof auth.$Infer.Session.user
type SessionData = typeof auth.$Infer.Session.session

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
