import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/habits/')({
  component: HabitsPage,
})

function HabitsPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
      <p className="mt-2 text-sm text-slate-500">Habit management is coming next.</p>
    </section>
  )
}
