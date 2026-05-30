import { describe, expect, it } from 'bun:test'
import { app } from '../index'

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
