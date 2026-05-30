import { Link } from '@tanstack/react-router'
import type { Habit } from '../hooks/useHabits'

// Presentational row: emoji, color dot, name, Edit link. Archive/delete and the
// drag handle are added by later tasks.
export function HabitRow({ habit }: { habit: Habit }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <span className="text-xl leading-none" aria-hidden="true">
        {habit.emoji}
      </span>
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: habit.color }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{habit.name}</span>
      <Link
        to="/habits/$habitId/edit"
        params={{ habitId: habit.id }}
        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        Edit
      </Link>
    </div>
  )
}
