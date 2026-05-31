import { Hono } from 'hono'
import { auth } from './lib/auth'
import { handleError } from './lib/errors'
import { requireAuth } from './lib/middleware'
import { habitsRoutes } from './routes/habits'
import { logsRoutes } from './routes/logs'
import { dashboardRoutes } from './routes/dashboard'

const app = new Hono()

// Standardized JSON for thrown errors, incl. a safe 500 for unexpected failures.
app.onError((err, c) => handleError(err, c))

// Public: better-auth serves register/login/logout under /api/auth/*
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

// Chained so AppType (Hono RPC) captures these routes' shapes
const routes = app
  .get('/api/health', (c) => c.json({ status: 'ok' as const }))
  .get('/api/me', requireAuth, (c) => c.json({ user: c.get('user') }))
  .route('/api/habits', habitsRoutes)
  .route('/api/logs', logsRoutes)
  .route('/api/dashboard', dashboardRoutes)

export type AppType = typeof routes
export { app }

export default {
  port: 3000,
  fetch: app.fetch,
}
