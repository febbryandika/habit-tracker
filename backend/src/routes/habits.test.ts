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

  it('rejects GET /api/habits without a session', async () => {
    const res = await app.request('/api/habits')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('rejects PUT /api/habits/:id without a session', async () => {
    const res = await app.request('/api/habits/abc', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })
})
