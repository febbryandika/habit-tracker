import { Hono } from 'hono'
import { auth } from './lib/auth'
import { requireAuth } from './lib/middleware'

const app = new Hono()

// Public: better-auth serves register/login/logout under /api/auth/*
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

// Chained so AppType (Hono RPC) captures these routes' shapes
const routes = app
  .get('/api/health', (c) => c.json({ status: 'ok' as const }))
  .get('/api/me', requireAuth, (c) => c.json({ user: c.get('user') }))

export type AppType = typeof routes
export { app }

export default {
  port: 3000,
  fetch: app.fetch,
}
