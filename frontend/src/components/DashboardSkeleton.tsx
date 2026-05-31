import { Skeleton } from './Skeleton'

// Placeholder cards shown while the dashboard query is pending. Mirrors the
// HabitCard grid so the layout doesn't shift when real data arrives.
export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div role="status" aria-busy="true" className="mt-6">
      <span className="sr-only">Loading your habits…</span>
      <ul className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
        {Array.from({ length: cards }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="size-10 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}
