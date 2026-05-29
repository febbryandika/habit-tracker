import { describe, expect, it } from 'bun:test'
import { app } from '../index'

describe('habit routes require auth', () => {
  it('rejects POST /api/habits without a session', async () => {
    const res = await app.request('/api/habits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Drink water' }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })
})
