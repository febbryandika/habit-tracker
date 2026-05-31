import type { QueryClient, QueryKey } from '@tanstack/react-query'

// The cache snapshot captured before an optimistic write, to roll back to on error.
type Rollback<TData> = { previous: TData | undefined }

// Builds onMutate/onError handlers for an optimistic update against a single query
// key: cancel in-flight refetches, snapshot the cache, apply the update, and
// restore the exact snapshot on error. Shared by the dashboard toggle and the
// habit-list mutations so every optimistic action rolls back the same, tested way.
export function optimisticListUpdate<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  update: (previous: TData | undefined, variables: TVariables) => TData | undefined,
) {
  return {
    onMutate: async (variables: TVariables): Promise<Rollback<TData>> => {
      // Cancel outgoing refetches so they can't overwrite the optimistic value.
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TData>(queryKey)
      queryClient.setQueryData<TData>(queryKey, (old) => update(old, variables))
      return { previous }
    },
    onError: (
      _error: unknown,
      _variables: TVariables,
      context: Rollback<TData> | undefined,
    ): void => {
      // Restore the pre-mutation snapshot. The global mutation handler then
      // shows the toast (or redirects on a 401) — rollback always runs first.
      if (context) queryClient.setQueryData<TData>(queryKey, context.previous)
    },
  }
}
