import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { HabitForm } from '../../../components/HabitForm'
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
          <p className="text-sm text-slate-500">Loading…</p>
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
