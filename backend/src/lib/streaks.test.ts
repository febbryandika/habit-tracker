import { describe, expect, it } from 'bun:test'
import { computeStreaks } from './streaks'

// Anchor relative to the runtime "today" so the current-streak walk-back is stable.
const today = new Date().toISOString().slice(0, 10)
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

describe('computeStreaks', () => {
  it('returns zeros for no logs', () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 })
  })

  it('counts a current streak walking back from today', () => {
    const { current } = computeStreaks([daysAgo(0), daysAgo(1), daysAgo(2)])
    expect(current).toBe(3)
  })

  it('reports current 0 when today is not completed', () => {
    const { current } = computeStreaks([daysAgo(1), daysAgo(2)])
    expect(current).toBe(0)
  })

  it('finds the longest run regardless of position', () => {
    // gap then a 4-day run in the past
    const { longest } = computeStreaks([
      '2026-01-01',
      '2026-01-10',
      '2026-01-11',
      '2026-01-12',
      '2026-01-13',
    ])
    expect(longest).toBe(4)
  })

  it('dedupes repeated dates', () => {
    expect(computeStreaks([today, today, today]).current).toBe(1)
  })

  it('stops the current streak at the first gap', () => {
    // today and 2 days ago logged, but NOT yesterday — streak is 1, not 2
    const { current, longest } = computeStreaks([daysAgo(0), daysAgo(2)])
    expect(current).toBe(1)
    expect(longest).toBe(1)
  })

  it('handles a single completion today', () => {
    expect(computeStreaks([today])).toEqual({ current: 1, longest: 1 })
  })

  it('handles a single completion in the past', () => {
    // run of 1 — the Math.max(longest, run) at the end must pick it up
    expect(computeStreaks([daysAgo(5)])).toEqual({ current: 0, longest: 1 })
  })

  it('current is 0 but longest reflects a past run when today is absent', () => {
    const { current, longest } = computeStreaks([daysAgo(5), daysAgo(6), daysAgo(7), daysAgo(8)])
    expect(current).toBe(0)
    expect(longest).toBe(4)
  })
})
