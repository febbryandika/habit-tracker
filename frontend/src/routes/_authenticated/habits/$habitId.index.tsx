import { createFileRoute, Link } from '@tanstack/react-router'
import { useHabits, useHabitStats } from '../../../hooks/useHabits'
import { HabitStats } from '../../../components/HabitStats'
import { HabitStatsSkeleton } from '../../../components/HabitStatsSkeleton'
import { Heatmap } from '../../../components/Heatmap'
import { Skeleton } from '../../../components/Skeleton'

export const Route = createFileRoute('/_authenticated/habits/$habitId/')({
  component: HabitDetailPage,
})

function HabitDetailPage() {
  const { habitId } = Route.useParams()
  // No single-habit GET endpoint; reuse the cached list queries for the habit's
  // name/emoji/color (same pattern as the edit page). Stats come from their own query.
  const active = useHabits(false)
  const archived = useHabits(true)
  const stats = useHabitStats(habitId)

  const habitLoading = active.isPending || archived.isPending
  const habit = [...(active.data ?? []), ...(archived.data ?? [])].find((h) => h.id === habitId)

  return (
    <section>
      <Link to="/habits" className="text-sm text-slate-500 transition hover:text-slate-900">
        ← Habits
      </Link>

      {habitLoading ? (
        <>
          <Skeleton className="mt-2 h-8 w-48" />
          <div className="mt-6">
            <HabitStatsSkeleton />
          </div>
        </>
      ) : !habit ? (
        <p className="mt-4 text-sm text-slate-500">
          Habit not found.{' '}
          <Link to="/habits" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to habits
          </Link>
        </p>
      ) : (
        <>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <span aria-hidden>{habit.emoji}</span>
            {habit.name}
          </h1>

          <div className="mt-6">
            {stats.isPending ? (
              <HabitStatsSkeleton />
            ) : stats.isError ? (
              <p role="alert" className="text-sm font-medium text-red-600">
                Couldn't load stats. Please refresh to try again.
              </p>
            ) : (
              <div className="space-y-8">
                <HabitStats
                  current={stats.data.current}
                  longest={stats.data.longest}
                  completionRate={stats.data.completionRate}
                  totalCompletions={stats.data.totalCompletions}
                />
                <div>
                  <h2 className="mb-3 text-sm font-medium text-slate-500">Last 12 weeks</h2>
                  <Heatmap cells={stats.data.heatmap} color={habit.color} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
