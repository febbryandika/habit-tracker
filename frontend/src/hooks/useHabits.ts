import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InferRequestType, InferResponseType } from 'hono/client'
import { client } from '../lib/client'

// Habit shape derived from the API contract — no hand-written duplication.
export type Habit = InferResponseType<typeof client.api.habits.$get, 200>[number]

type CreateInput = InferRequestType<typeof client.api.habits.$post>['json']
type UpdateInput = InferRequestType<(typeof client.api.habits)[':id']['$put']>['json']

export const habitKeys = {
  all: ['habits'] as const,
  list: (archived: boolean) => ['habits', { archived }] as const,
}

// Surface the backend's `{ error }` message so callers (dialogs, forms) can show it.
async function throwApiError(res: { json(): Promise<unknown> }): Promise<never> {
  let message = 'Something went wrong'
  try {
    const body = await res.json()
    if (body && typeof body === 'object' && 'error' in body) {
      const { error } = body as { error?: unknown }
      if (typeof error === 'string') message = error
    }
  } catch {
    // non-JSON response; keep the default message
  }
  throw new Error(message)
}

export function useHabits(archived = false) {
  return useQuery({
    queryKey: habitKeys.list(archived),
    queryFn: async () => {
      const res = await client.api.habits.$get({ query: { archived: archived ? 'true' : 'false' } })
      if (!res.ok) throw new Error('Failed to load habits')
      return (await res.json()) as Habit[]
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  })
}

export function useArchiveHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.habits[':id'].archive.$delete({ param: { id } })
      if (!res.ok) await throwApiError(res)
      return (await res.json()) as Habit
    },
    // Optimistically drop the habit from the active list; it reappears under Archived.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.list(false) })
      const previous = queryClient.getQueryData<Habit[]>(habitKeys.list(false))
      queryClient.setQueryData<Habit[]>(habitKeys.list(false), (old) =>
        old?.filter((h) => h.id !== id),
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(habitKeys.list(false), ctx.previous)
    },
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  })
}

// Accepts the new active-list order; persists only habits whose position changed.
export function useReorderHabits() {
  const queryClient = useQueryClient()
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
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.list(false) })
      const previous = queryClient.getQueryData<Habit[]>(habitKeys.list(false))
      queryClient.setQueryData<Habit[]>(
        habitKeys.list(false),
        ordered.map((habit, index) => ({ ...habit, sortOrder: index })),
      )
      return { previous }
    },
    onError: (_err, _ordered, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(habitKeys.list(false), ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: habitKeys.list(false) }),
  })
}
