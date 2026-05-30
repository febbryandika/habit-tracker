import { useMemo } from 'react'

type Cell = { date: string; completed: boolean }

type HeatmapProps = {
  cells: Cell[] // last 84 days, oldest → today (from the stats endpoint)
  color: string // habit color; filled cells use it, empty cells stay neutral
}

// Friendly tooltip label, e.g. "May 31, 2026 — completed".
function label({ date, completed }: Cell): string {
  const formatted = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${formatted} — ${completed ? 'completed' : 'not completed'}`
}

// GitHub-style 12-week heatmap. Column-major flow (grid-flow-col over 7 rows)
// makes each column a 7-day week, oldest week left → newest right.
// Cells are decorative; the grid carries one summary label for assistive tech.
export function Heatmap({ cells, color }: HeatmapProps) {
  const tiles = useMemo(
    () => cells.map((cell) => ({ key: cell.date, completed: cell.completed, title: label(cell) })),
    [cells],
  )
  const completed = tiles.filter((t) => t.completed).length

  return (
    <div
      role="img"
      aria-label={`Completion heatmap, last ${cells.length} days. ${completed} completed.`}
      className="grid grid-flow-col grid-rows-7 gap-1"
    >
      {tiles.map((tile) => (
        <div
          key={tile.key}
          aria-hidden
          title={tile.title}
          style={tile.completed ? { backgroundColor: color } : undefined}
          className={`size-3.5 rounded-sm ${tile.completed ? '' : 'bg-slate-100'}`}
        />
      ))}
    </div>
  )
}
