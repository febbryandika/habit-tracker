import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useHabits } from '../../../hooks/useHabits'
import { HabitRow } from '../../../components/HabitRow'
import { HabitListSkeleton } from '../../../components/HabitListSkeleton'

export const Route = createFileRoute('/_authenticated/habits/')({
  component: HabitsPage,
})

const filters = [
  { key: 'active', label: 'Active', archived: false },
  { key: 'archived', label: 'Archived', archived: true },
] as const

type FilterKey = (typeof filters)[number]['key']

function HabitsPage() {
  const [filter, setFilter] = useState<FilterKey>('active')
  const archived = filter === 'archived'
  const habits = useHabits(archived)

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        <Link
          to="/habits/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          New habit
        </Link>
      </div>

      <div
        role="group"
        aria-label="Filter habits by status"
        className="mt-6 inline-flex gap-1 rounded-lg bg-slate-100 p-1 text-sm"
      >
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              filter === f.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {habits.isPending ? (
          <HabitListSkeleton />
        ) : habits.isError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            Couldn't load habits.
          </p>
        ) : habits.data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              {archived ? 'Nothing archived' : 'No habits yet'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {archived
                ? 'Habits you archive will show up here.'
                : 'Create your first habit to start tracking.'}
            </p>
            {archived ? null : (
              <Link
                to="/habits/new"
                className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                New habit
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {habits.data.map((habit) => (
              <li key={habit.id}>
                <HabitRow habit={habit} archived={archived} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
