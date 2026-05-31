import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { client } from '../../lib/client'
import { throwApiError } from '../../lib/api-error'
import { HabitCard } from '../../components/HabitCard'
import { DashboardSkeleton } from '../../components/DashboardSkeleton'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await client.api.dashboard.$get()
      if (!res.ok) await throwApiError(res)
      return res.json()
    },
  })

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">Today</h1>

      {dashboard.isPending ? (
        <DashboardSkeleton />
      ) : dashboard.isError ? (
        <p role="alert" className="mt-6 text-sm font-medium text-red-600">
          Couldn't load your habits. Please refresh to try again.
        </p>
      ) : dashboard.data.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">No habits yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first habit to start tracking.
          </p>
          <Link
            to="/habits/new"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            New habit
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {dashboard.data.map((habit) => (
            <li key={habit.id}>
              <HabitCard habit={habit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
