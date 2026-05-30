import type { ReactNode } from 'react'
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'

function Panel({ title, message, children }: { title: string; message: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">{children}</div>
      </div>
    </div>
  )
}

const primaryAction =
  'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-300'

// Router-level boundary for unexpected render/loader failures (incl. an
// unhandled server/database error surfaced as a thrown ApiError). Page-level
// query errors are still handled inline by each page; this catches the rest
// instead of crashing the app to a blank screen.
export function ErrorFallback({ reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <Panel
      title="Something went wrong"
      message="An unexpected error occurred. You can try again, or head back to your dashboard."
    >
      <button
        type="button"
        onClick={() => {
          reset()
          router.invalidate()
        }}
        className={primaryAction}
      >
        Try again
      </button>
      <Link
        to="/dashboard"
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        Go to dashboard
      </Link>
    </Panel>
  )
}

// Shown for unmatched routes.
export function NotFound() {
  return (
    <Panel
      title="Page not found"
      message="The page you're looking for doesn't exist or may have moved."
    >
      <Link to="/dashboard" className={primaryAction}>
        Go to dashboard
      </Link>
    </Panel>
  )
}
