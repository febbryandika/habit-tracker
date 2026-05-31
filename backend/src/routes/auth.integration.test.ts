import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'
import { createTestDb } from '../test/db'
import { signUpAndGetCookie } from '../test/auth'

const { db, client } = await createTestDb()
mock.module('../db', () => ({ db }))
const { app } = await import('../index')

// Shared user — created once and reused by sign-in and protected-endpoint tests.
let sharedCookie: string
let sharedEmail: string

beforeAll(async () => {
  const result = await signUpAndGetCookie(app)
  sharedCookie = result.cookie
  sharedEmail = result.email
})

afterAll(() => client.close())

describe('POST /api/auth/sign-up/email', () => {
  it('creates a session and immediately returns the user on /api/me', async () => {
    const email = `signup-${Math.random().toString(36).slice(2)}@example.com`
    const res = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', name: 'Register Test' }),
    })

    expect(res.status).toBe(200)

    const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]
    expect(cookie).toMatch(/^better-auth/)

    // The session from sign-up must be valid immediately.
    const meRes = await app.request('/api/me', { headers: { cookie } })
    expect(meRes.status).toBe(200)
    const { user } = await meRes.json() as { user: { email: string; name: string } }
    expect(user.email).toBe(email)
    expect(user.name).toBe('Register Test')
  })
})

describe('POST /api/auth/sign-in/email', () => {
  it('returns a session cookie with correct credentials', async () => {
    const res = await app.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: sharedEmail, password: 'password123' }),
    })

    expect(res.status).toBe(200)
    const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]
    expect(cookie).toMatch(/^better-auth/)
  })

  it('rejects incorrect password', async () => {
    const res = await app.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: sharedEmail, password: 'wrong-password' }),
    })

    expect(res.status).not.toBe(200)
  })
})

describe('Protected endpoints', () => {
  it('returns 401 on /api/me without a session cookie', async () => {
    const res = await app.request('/api/me')
    expect(res.status).toBe(401)
  })

  it('returns the authenticated user on /api/me with a valid cookie', async () => {
    const res = await app.request('/api/me', { headers: { cookie: sharedCookie } })

    expect(res.status).toBe(200)
    const { user } = await res.json() as { user: { email: string } }
    expect(user.email).toBe(sharedEmail)
  })

  it('returns 200 on /api/dashboard with a valid cookie', async () => {
    const res = await app.request('/api/dashboard', { headers: { cookie: sharedCookie } })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/auth/sign-out', () => {
  it('invalidates the session so the next protected call returns 401', async () => {
    // Use a fresh user so the shared cookie is unaffected by this test.
    const { cookie } = await signUpAndGetCookie(app)

    const before = await app.request('/api/me', { headers: { cookie } })
    expect(before.status).toBe(200)

    await app.request('/api/auth/sign-out', {
      method: 'POST',
      headers: { cookie },
    })

    const after = await app.request('/api/me', { headers: { cookie } })
    expect(after.status).toBe(401)
  })
})
