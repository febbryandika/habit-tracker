import { createAuthClient } from 'better-auth/react'

// baseURL must be an absolute origin; better-auth appends its default basePath (/api/auth).
// Using the current origin keeps requests same-origin, so Vite proxies /api/auth/* to the backend in dev.
export const authClient = createAuthClient({ baseURL: window.location.origin })

export const { signIn, signUp, signOut, useSession } = authClient
