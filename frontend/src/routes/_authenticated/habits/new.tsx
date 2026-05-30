import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { HabitForm } from '../../../components/HabitForm'
import { useCreateHabit } from '../../../hooks/useHabits'

export const Route = createFileRoute('/_authenticated/habits/new')({
  component: NewHabitPage,
})

function NewHabitPage() {
  const navigate = useNavigate()
  const createHabit = useCreateHabit()
  const [formError, setFormError] = useState<string | null>(null)

  return (
    <section>
      <Link to="/habits" className="text-sm text-slate-500 transition hover:text-slate-900">
        ← Habits
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New habit</h1>

      <div className="mt-6 max-w-md">
        <HabitForm
          submitLabel="Create habit"
          isSubmitting={createHabit.isPending}
          formError={formError}
          onSubmit={(values) => {
            setFormError(null)
            createHabit.mutate(values, {
              onSuccess: () => navigate({ to: '/habits' }),
              onError: (err) =>
                setFormError(err instanceof Error ? err.message : 'Could not create habit'),
            })
          }}
        />
      </div>
    </section>
  )
}
