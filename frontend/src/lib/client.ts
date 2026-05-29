import { hc } from 'hono/client'
import type { AppType } from 'backend'

// Same-origin: '/api/*' calls are proxied to the backend by Vite in dev.
// `credentials: 'include'` ensures the better-auth session cookie rides along on protected routes.
export const client = hc<AppType>('/', { init: { credentials: 'include' } })
