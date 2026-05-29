import { hc } from 'hono/client'
import type { AppType } from 'backend'

// Same-origin: '/api/*' calls are proxied to the backend by Vite in dev.
export const client = hc<AppType>('/')
