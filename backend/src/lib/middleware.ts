import { createMiddleware } from 'hono/factory'
import { auth } from './auth'

type SessionUser = typeof auth.$Infer.Session.user
type SessionData = typeof auth.$Infer.Session.session

// Gates a route behind a valid better-auth session and puts the user on context.
// Used by the habit/log routes added in later steps.
export const requireAuth = createMiddleware<{
  Variables: { user: SessionUser; session: SessionData }
}>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})
