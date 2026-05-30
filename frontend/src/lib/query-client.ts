import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import type { AnyRouter } from '@tanstack/react-router'
import { ApiError } from './api-error'

// Builds the app's QueryClient with one centralized place to react to auth
// failures. A 401 from any query or mutation means the session is gone (expired
// or signed out elsewhere) — redirect to /login, preserving the current
// location so the user lands back where they were after re-authenticating.
export function createAppQueryClient(router: AnyRouter): QueryClient {
  function handleUnauthorized(error: unknown): void {
    if (!(error instanceof ApiError) || error.status !== 401) return
    const { pathname, href } = router.state.location
    // Already on an auth screen — nothing to redirect away from.
    if (pathname === '/login' || pathname === '/register') return
    queryClient.clear()
    void router.navigate({ to: '/login', search: { redirect: href } })
  }

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleUnauthorized }),
    mutationCache: new MutationCache({ onError: handleUnauthorized }),
    defaultOptions: {
      queries: {
        // Don't retry 4xx (incl. 401) — they won't fix themselves on retry, and
        // skipping retries lets the redirect fire immediately, not after backoff.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
          failureCount < 3,
      },
    },
  })

  return queryClient
}
