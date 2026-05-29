import { createAuthClient } from 'better-auth/react'

// Auth endpoints are proxied to the backend at /api/auth/* in dev.
export const authClient = createAuthClient({ baseURL: '/api/auth' })
