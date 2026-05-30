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
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })

  it('rejects GET /api/habits without a session', async () => {
    const res = await app.request('/api/habits')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })

  it('rejects PUT /api/habits/:id without a session', async () => {
    const res = await app.request('/api/habits/abc', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })

  it('rejects DELETE /api/habits/:id/archive without a session', async () => {
    const res = await app.request('/api/habits/abc/archive', { method: 'DELETE' })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })

  it('rejects DELETE /api/habits/:id/unarchive without a session', async () => {
    const res = await app.request('/api/habits/abc/unarchive', { method: 'DELETE' })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })

  it('rejects DELETE /api/habits/:id without a session', async () => {
    const res = await app.request('/api/habits/abc', { method: 'DELETE' })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })

  it('rejects PATCH /api/habits/:id/order without a session', async () => {
    const res = await app.request('/api/habits/abc/order', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sortOrder: 2 }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })

  it('rejects GET /api/habits/:id/stats without a session', async () => {
    const res = await app.request('/api/habits/abc/stats')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })
})
