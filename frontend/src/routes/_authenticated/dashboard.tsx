import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { client } from '../../lib/client'
import { throwApiError } from '../../lib/api-error'
import { HabitCard } from '../../components/HabitCard'

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
        <p className="mt-6 text-sm text-slate-500">Loading your habits…</p>
      ) : dashboard.isError ? (
        <p role="alert" className="mt-6 text-sm font-medium text-red-600">
          Couldn't load your habits. Please refresh to try again.
        </p>
      ) : dashboard.data.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No habits yet. Create one to start tracking.</p>
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
