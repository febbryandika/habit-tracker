type HabitStatsProps = {
  current: number
  longest: number
  completionRate: number // 0–1 fraction over the last 30 days
  totalCompletions: number
}

// Summary cards for the habit detail page: current/longest streaks, completion
// rate, and total completions. Purely presentational — the detail page passes
// the values from the stats query.
export function HabitStats({ current, longest, completionRate, totalCompletions }: HabitStatsProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Current streak" value={current} icon={current > 0 ? '🔥' : undefined} />
      <Stat label="Longest streak" value={longest} />
      <Stat
        label="Completion rate"
        value={`${Math.round(completionRate * 100)}%`}
        hint="last 30 days"
      />
      <Stat label="Total completions" value={totalCompletions} />
    </dl>
  )
}

type StatProps = {
  label: string
  value: number | string
  icon?: string
  hint?: string
}

function Stat({ label, value, icon, hint }: StatProps) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1.5 text-2xl font-semibold text-slate-900">
        {icon ? <span aria-hidden>{icon}</span> : null}
        {value}
      </dd>
      {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}
