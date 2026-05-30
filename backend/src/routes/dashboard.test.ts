import { describe, expect, it } from 'bun:test'
import { app } from '../index'

describe('dashboard route requires auth', () => {
  it('rejects GET /api/dashboard without a session', async () => {
    const res = await app.request('/api/dashboard')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })
})
