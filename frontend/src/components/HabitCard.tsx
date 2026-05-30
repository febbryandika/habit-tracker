import type { InferResponseType } from 'hono/client'
import { client } from '../lib/client'
import { useToggleCompletion } from '../hooks/useToggleCompletion'
import { StreakBadge } from './StreakBadge'

export type DashboardHabit = InferResponseType<typeof client.api.dashboard.$get>[number]

type HabitCardProps = {
  habit: DashboardHabit
}

// A single habit on the dashboard: emoji, name, streak badge, and a completion
// toggle with optimistic updates.
export function HabitCard({ habit }: HabitCardProps) {
  const { id, name, emoji, color, completedToday, currentStreak } = habit
  const toggle = useToggleCompletion(id)

  function handleToggle() {
    toggle.mutate()
  }

  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-xl text-xl"
        style={{ backgroundColor: `${color}1a` }}
      >
        {emoji}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
        <div className="mt-1">
          <StreakBadge count={currentStreak} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={completedToday}
        aria-label={completedToday ? `Mark ${name} as not done today` : `Mark ${name} as done today`}
        style={completedToday ? { backgroundColor: color, borderColor: color } : undefined}
        className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-slate-300 transition hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={completedToday ? 'size-5 text-white' : 'size-5 text-transparent'}
        >
          <path d="m5 10 3.5 3.5L15 6.5" />
        </svg>
      </button>
    </article>
  )
}
