import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import type { AnyRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ApiError } from './api-error'

// Typed mutation meta drives the centralized toast behavior, so feedback lives in
// one place (no duplicate toasts scattered across mutations).
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      // Show this success toast when the mutation resolves.
      successMessage?: string
      // Skip the automatic error toast — for mutations that render the error
      // inline instead (e.g. the habit forms and the delete confirm dialog).
      suppressErrorToast?: boolean
    }
  }
}

// Builds the app's QueryClient with one centralized place to react to auth
// failures and surface mutation feedback.
export function createAppQueryClient(router: AnyRouter): QueryClient {
  // A 401 means the session is gone (expired or signed out elsewhere). Redirect
  // to /login, preserving the current location so the user returns after re-auth.
  // Returns true when it handled the error, so callers can skip a redundant toast.
  function redirectIfUnauthorized(error: unknown): boolean {
    if (!(error instanceof ApiError) || error.status !== 401) return false
    const { pathname, href } = router.state.location
    if (pathname === '/login' || pathname === '/register') return true
    queryClient.clear()
    void router.navigate({ to: '/login', search: { redirect: href } })
    return true
  }

  const queryClient = new QueryClient({
    // Queries surface errors via each page's own error state; only the auth
    // redirect is global here.
    queryCache: new QueryCache({ onError: redirectIfUnauthorized }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (redirectIfUnauthorized(error)) return
        if (mutation.meta?.suppressErrorToast) return
        toast.error(error.message || 'Something went wrong')
      },
      onSuccess: (_data, _vars, _ctx, mutation) => {
        if (mutation.meta?.successMessage) toast.success(mutation.meta.successMessage)
      },
    }),
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
