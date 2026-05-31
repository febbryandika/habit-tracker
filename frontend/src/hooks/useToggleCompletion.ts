import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../lib/client'
import { throwApiError } from '../lib/api-error'
import { optimisticListUpdate } from '../lib/optimistic'
import type { DashboardHabit } from '../components/HabitCard'

const dashboardKey = ['dashboard'] as const

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// Optimistically flips a habit's completion for today and adjusts its streak,
// rolling back on error and reconciling with the server on settle.
// Instantiated per HabitCard so isPending is scoped to that card.
export function useToggleCompletion(habitId: string) {
  const queryClient = useQueryClient()
  // Flip this habit's completion for today and nudge its streak; rolled back on
  // error by the shared helper, reconciled with the server on settle.
  const optimistic = optimisticListUpdate<DashboardHabit[], void>(queryClient, dashboardKey, (habits) =>
    habits?.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            completedToday: !habit.completedToday,
            currentStreak: habit.completedToday
              ? Math.max(0, habit.currentStreak - 1)
              : habit.currentStreak + 1,
          }
        : habit,
    ),
  )

  return useMutation({
    mutationFn: async () => {
      const res = await client.api.logs.toggle.$post({ json: { habitId, date: today() } })
      if (!res.ok) await throwApiError(res)
      return res.json()
    },
    onMutate: optimistic.onMutate,
    onError: optimistic.onError,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKey })
    },
  })
}
