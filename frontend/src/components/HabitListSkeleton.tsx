// Placeholder rows shown while the habits query is pending. Mirrors HabitRow's
// shape so the layout doesn't jump when real data arrives.
export function HabitListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading habits…</span>
      <ul className="space-y-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
          >
            <div className="size-6 animate-pulse rounded-md bg-slate-200" />
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
          </li>
        ))}
      </ul>
    </div>
  )
}
