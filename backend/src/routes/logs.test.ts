import { describe, expect, it } from 'bun:test'
import { app } from '../index'
import { toggleLog } from './logs'

describe('log routes require auth', () => {
  it('rejects POST /api/logs/toggle without a session', async () => {
    const res = await app.request('/api/logs/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ habitId: 'abc', date: '2026-05-30' }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })
})

describe('toggleLog date validation', () => {
  it('accepts a real calendar date', () => {
    expect(toggleLog.safeParse({ habitId: 'abc', date: '2026-05-30' }).success).toBe(true)
  })

  it('rejects a malformed date', () => {
    expect(toggleLog.safeParse({ habitId: 'abc', date: '2026-5-30' }).success).toBe(false)
    expect(toggleLog.safeParse({ habitId: 'abc', date: 'not-a-date' }).success).toBe(false)
  })

  it('rejects impossible calendar dates', () => {
    expect(toggleLog.safeParse({ habitId: 'abc', date: '2026-02-30' }).success).toBe(false)
    expect(toggleLog.safeParse({ habitId: 'abc', date: '2026-13-45' }).success).toBe(false)
  })

  it('rejects an empty habitId', () => {
    expect(toggleLog.safeParse({ habitId: '', date: '2026-05-30' }).success).toBe(false)
  })
})
