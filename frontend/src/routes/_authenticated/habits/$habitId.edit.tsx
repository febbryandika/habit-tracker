import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { HabitForm } from '../../../components/HabitForm'
import { Skeleton } from '../../../components/Skeleton'
import { useHabits, useUpdateHabit } from '../../../hooks/useHabits'

export const Route = createFileRoute('/_authenticated/habits/$habitId/edit')({
  component: EditHabitPage,
})

function EditHabitPage() {
  const { habitId } = Route.useParams()
  const navigate = useNavigate()
  // No single-habit GET endpoint exists; the habit lives in one of the two
  // list queries (both cached, so this is instant when reached from the list).
  const active = useHabits(false)
  const archived = useHabits(true)
  const updateHabit = useUpdateHabit()
  const [formError, setFormError] = useState<string | null>(null)

  const isLoading = active.isPending || archived.isPending
  const habit = [...(active.data ?? []), ...(archived.data ?? [])].find((h) => h.id === habitId)

  return (
    <section>
      <Link to="/habits" className="text-sm text-slate-500 transition hover:text-slate-900">
        ← Habits
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit habit</h1>

      <div className="mt-6 max-w-md">
        {isLoading ? (
          <div role="status" aria-busy="true" className="space-y-5">
            <span className="sr-only">Loading…</span>
            <div aria-hidden className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div aria-hidden className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        ) : !habit ? (
          <p className="text-sm text-slate-500">
            Habit not found.{' '}
            <Link to="/habits" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to habits
            </Link>
          </p>
        ) : (
          <HabitForm
            initialValues={{ name: habit.name, emoji: habit.emoji, color: habit.color }}
            submitLabel="Save changes"
            isSubmitting={updateHabit.isPending}
            formError={formError}
            onSubmit={(values) => {
              setFormError(null)
              updateHabit.mutate(
                { id: habit.id, data: values },
                {
                  onSuccess: () => navigate({ to: '/habits' }),
                  onError: (err) =>
                    setFormError(err instanceof Error ? err.message : 'Could not save changes'),
                },
              )
            }}
          />
        )}
      </div>
    </section>
  )
}
