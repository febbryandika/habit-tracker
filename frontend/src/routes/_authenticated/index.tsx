import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { client } from '../../lib/client'
import { signOut } from '../../lib/auth-client'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})

function Home() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  // Server-verified identity via the credentialed RPC client — proves the
  // session cookie reaches the protected /api/me route.
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await client.api.me.$get()
      if (!res.ok) throw new Error('Unauthorized')
      return res.json()
    },
  })

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold tracking-tight">Habit Tracker</h1>

        <p className="mt-2 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-900">{user.name}</span>
        </p>

        <dl className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-100">
          <dt className="text-slate-500">Server says (/api/me)</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {me.isPending ? '…' : me.isError ? 'unreachable' : me.data.user.email}
          </dd>
        </dl>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Sign out
        </button>
      </div>
    </main>
  )
}
