import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { client } from '../lib/client'
import { throwApiError } from '../lib/api-error'
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

  return useMutation({
    mutationFn: async () => {
      const res = await client.api.logs.toggle.$post({ json: { habitId, date: today() } })
      if (!res.ok) await throwApiError(res)
      return res.json()
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: dashboardKey })
      const previous = queryClient.getQueryData<DashboardHabit[]>(dashboardKey)

      queryClient.setQueryData<DashboardHabit[]>(dashboardKey, (habits) =>
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

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dashboardKey, context.previous)
      }
      toast.error("Couldn't update habit. Please try again.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKey })
    },
  })
}
