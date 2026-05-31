import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { authClient, signOut } from '../lib/auth-client'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession()
    if (!data) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    // Exposed to child routes via Route.useRouteContext().
    return { user: data.user }
  },
  component: AppLayout,
})

const navLinkBase = 'rounded-lg px-3 py-1.5 font-medium transition'

function AppLayout() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-indigo-600 focus:ring-2 focus:ring-indigo-300"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
          <Link to="/dashboard" className="text-base font-semibold tracking-tight">
            Habit Tracker
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/dashboard"
              className={navLinkBase}
              activeProps={{ className: 'bg-slate-100 text-slate-900' }}
              inactiveProps={{ className: 'text-slate-500 hover:text-slate-900' }}
            >
              Dashboard
            </Link>
            <Link
              to="/habits"
              className={navLinkBase}
              activeProps={{ className: 'bg-slate-100 text-slate-900' }}
              inactiveProps={{ className: 'text-slate-500 hover:text-slate-900' }}
            >
              Habits
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{user.name}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
