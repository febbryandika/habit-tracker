import type { Habit } from '../hooks/useHabits'

// Presentational row: emoji, color dot, name. Actions (edit/archive/delete) and
// the drag handle are added by later tasks.
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
      <span className="truncate font-medium text-slate-900">{habit.name}</span>
    </div>
  )
}
