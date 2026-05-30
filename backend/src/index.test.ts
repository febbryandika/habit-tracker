import { describe, expect, it } from 'bun:test'
import { app } from './index'

describe('protected route handling', () => {
  it('rejects /api/me without a session', async () => {
    const res = await app.request('/api/me')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })
})
