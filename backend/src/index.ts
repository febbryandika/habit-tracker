import { Hono } from 'hono'
import { auth } from './lib/auth'

const app = new Hono().get('/api/health', (c) => c.json({ status: 'ok' as const }))

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

export type AppType = typeof app

export default {
  port: 3000,
  fetch: app.fetch,
}
