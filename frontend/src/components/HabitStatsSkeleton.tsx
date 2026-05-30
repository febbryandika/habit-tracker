import { Skeleton } from './Skeleton'

// Placeholder for the stats cards + 12-week heatmap while the stats query is
// pending. Mirrors HabitStats (4 cards) and Heatmap (84 cells) to avoid layout shift.
export function HabitStatsSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-8">
      <span className="sr-only">Loading stats…</span>
      <div aria-hidden className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>
      <div aria-hidden>
        <Skeleton className="mb-3 h-4 w-24" />
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {Array.from({ length: 84 }).map((_, i) => (
            <Skeleton key={i} className="size-3.5 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  )
}
