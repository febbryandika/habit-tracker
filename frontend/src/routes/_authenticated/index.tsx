import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { client } from '../../lib/client'
import { signOut } from '../../lib/auth-client'
import { HabitCard } from '../../components/HabitCard'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await client.api.dashboard.$get()
      if (!res.ok) throw new Error('Failed to load dashboard')
      return res.json()
    },
  })

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Habit Tracker</h1>
            <p className="text-sm text-slate-500">Signed in as {user.name}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="text-sm font-medium tracking-wide text-slate-500 uppercase">Today</h2>

        {dashboard.isPending ? (
          <p className="mt-6 text-sm text-slate-500">Loading your habits…</p>
        ) : dashboard.isError ? (
          <p role="alert" className="mt-6 text-sm font-medium text-red-600">
            Couldn't load your habits. Please refresh to try again.
          </p>
        ) : dashboard.data.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No habits yet. Create one to start tracking.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {dashboard.data.map((habit) => (
              <li key={habit.id}>
                <HabitCard habit={habit} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
