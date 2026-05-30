import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = Route.useRouteContext()

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Today's habits and completion tracking will live here. For now, head to{' '}
        <span className="font-medium text-slate-900">Habits</span> to set them up.
      </p>
    </section>
  )
}
