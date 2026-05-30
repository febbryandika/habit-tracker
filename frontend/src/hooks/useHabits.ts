import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InferRequestType, InferResponseType } from 'hono/client'
import { client } from '../lib/client'
import { throwApiError } from '../lib/api-error'
import { optimisticListUpdate } from '../lib/optimistic'

// Habit shape derived from the API contract — no hand-written duplication.
export type Habit = InferResponseType<typeof client.api.habits.$get, 200>[number]

type CreateInput = InferRequestType<typeof client.api.habits.$post>['json']
type UpdateInput = InferRequestType<(typeof client.api.habits)[':id']['$put']>['json']

export const habitKeys = {
  all: ['habits'] as const,
  list: (archived: boolean) => ['habits', { archived }] as const,
  stats: (id: string) => ['habits', id, 'stats'] as const,
}

// Stats response (streaks, 30-day rate, totals, 84-day heatmap) from the contract.
type HabitStats = InferResponseType<(typeof client.api.habits)[':id']['stats']['$get'], 200>

export function useHabits(archived = false) {
  return useQuery({
    queryKey: habitKeys.list(archived),
    queryFn: async () => {
      const res = await client.api.habits.$get({ query: { archived: archived ? 'true' : 'false' } })
      if (!res.ok) await throwApiError(res)
      return (await res.json()) as Habit[]
    },
  })
}

export function useHabitStats(habitId: string) {
  return useQuery({
    queryKey: habitKeys.stats(habitId),
    queryFn: async () => {
      const res = await client.api.habits[':id'].stats.$get({ param: { id: habitId } })
      if (!res.ok) await throwApiError(res)
      return (await res.json()) as HabitStats
    },
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const res = await client.api.habits.$post({ json: input })
      if (!res.ok) await throwApiError(res)
      return (await res.json()) as Habit
    },
    // Form renders its own error inline; only toast the success here.
    meta: { successMessage: 'Habit created', suppressErrorToast: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInput }) => {
      const res = await client.api.habits[':id'].$put({ param: { id }, json: data })
      if (!res.ok) await throwApiError(res)
      return (await res.json()) as Habit
    },
    // Form renders its own error inline; only toast the success here.
    meta: { successMessage: 'Habit updated', suppressErrorToast: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  })
}

export function useArchiveHabit() {
  const queryClient = useQueryClient()
  // Optimistically drop the habit from the active list; it reappears under Archived.
  const optimistic = optimisticListUpdate<Habit[], string>(
    queryClient,
    habitKeys.list(false),
    (previous, id) => previous?.filter((h) => h.id !== id),
  )
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.habits[':id'].archive.$delete({ param: { id } })
      if (!res.ok) await throwApiError(res)
      return (await res.json()) as Habit
    },
    meta: { successMessage: 'Habit archived' },
    onMutate: optimistic.onMutate,
    onError: optimistic.onError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  })
}

export function useRestoreHabit() {
  const queryClient = useQueryClient()
  // Optimistically drop the habit from the archived list; it reappears under Active.
  const optimistic = optimisticListUpdate<Habit[], string>(
    queryClient,
    habitKeys.list(true),
    (previous, id) => previous?.filter((h) => h.id !== id),
  )
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.habits[':id'].unarchive.$delete({ param: { id } })
      if (!res.ok) await throwApiError(res)
      return (await res.json()) as Habit
    },
    meta: { successMessage: 'Habit restored' },
    onMutate: optimistic.onMutate,
    onError: optimistic.onError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  })
}

// Not optimistic: delete can fail with 409 (habit has logs); the confirm dialog
// shows the pending state and surfaces the error instead of flickering the row.
export function useDeleteHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.habits[':id'].$delete({ param: { id } })
      if (!res.ok) await throwApiError(res)
      return (await res.json()) as { success: true }
    },
    // Confirm dialog renders its own error inline; only toast the success here.
    meta: { successMessage: 'Habit deleted', suppressErrorToast: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  })
}

// Accepts the new active-list order; persists only habits whose position changed.
export function useReorderHabits() {
  const queryClient = useQueryClient()
  const optimistic = optimisticListUpdate<Habit[], Habit[]>(
    queryClient,
    habitKeys.list(false),
    (_previous, ordered) => ordered.map((habit, index) => ({ ...habit, sortOrder: index })),
  )
  return useMutation({
    mutationFn: async (ordered: Habit[]) => {
      const changed = ordered
        .map((habit, index) => ({ habit, index }))
        .filter(({ habit, index }) => habit.sortOrder !== index)
      await Promise.all(
        changed.map(async ({ habit, index }) => {
          const res = await client.api.habits[':id'].order.$patch({
            param: { id: habit.id },
            json: { sortOrder: index },
          })
          if (!res.ok) await throwApiError(res)
        }),
      )
    },
    onMutate: optimistic.onMutate,
    onError: optimistic.onError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: habitKeys.list(false) }),
  })
}
