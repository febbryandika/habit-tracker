// Derives streaks from the set of dates a habit was completed.
// current: consecutive days ending today (walk back from today).
// longest: longest run of consecutive days anywhere in the history.
// See SPEC.md §3.4 for the reference implementation.
export function computeStreaks(logDates: string[]): { current: number; longest: number } {
  const sorted = [...new Set(logDates)].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  let current = 0
  let check = today

  for (const d of sorted) {
    if (d === check) {
      current++
      check = new Date(new Date(d).getTime() - 86400000).toISOString().slice(0, 10)
    } else {
      break
    }
  }

  // Longest streak (sliding window over sorted ascending dates)
  const asc = [...sorted].reverse()
  let longest = 0,
    run = asc.length > 0 ? 1 : 0
  for (let i = 1; i < asc.length; i++) {
    const diff = (new Date(asc[i]).getTime() - new Date(asc[i - 1]).getTime()) / 86400000
    run = diff === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  return { current, longest: Math.max(longest, run) }
}
