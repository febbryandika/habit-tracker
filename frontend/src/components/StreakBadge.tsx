type StreakBadgeProps = {
  count: number
}

// 🔥 + current streak count. Renders nothing when there is no active streak.
export function StreakBadge({ count }: StreakBadgeProps) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600 ring-1 ring-orange-100">
      <span aria-hidden>🔥</span>
      {count}
      <span className="sr-only">day streak</span>
    </span>
  )
}
