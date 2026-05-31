import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { habitLogs, habits } from '../db/schema'
import { createTestDb } from '../test/db'
import { signUpAndGetCookie } from '../test/auth'

// Mock the db module BEFORE importing anything that depends on it.
// All transitive imports (routes, auth) will receive this PGlite instance.
const { db, client } = await createTestDb()
mock.module('../db', () => ({ db }))
const { app } = await import('../index')

const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

let authCookie: string
let habitId: string
let user2Cookie: string

beforeAll(async () => {
  const user1 = await signUpAndGetCookie(app)
  authCookie = user1.cookie

  const meRes = await app.request('/api/me', { headers: { cookie: authCookie } })
  const { user } = await meRes.json() as { user: { id: string } }

  habitId = createId()
  await db.insert(habits).values({ id: habitId, userId: user.id, name: 'Test habit' })

  const user2 = await signUpAndGetCookie(app)
  user2Cookie = user2.cookie
})

afterAll(() => client.close())

describe('POST /api/logs/toggle', () => {
  it('toggles on — inserts a log row and returns { completed: true }', async () => {
    const res = await app.request('/api/logs/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authCookie },
      body: JSON.stringify({ habitId, date: today }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ completed: true })

    const rows = await db.select().from(habitLogs).where(
      and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, today)),
    )
    expect(rows).toHaveLength(1)
  })

  it('toggles off — deletes the row and returns { completed: false }', async () => {
    // Uses yesterday to keep state independent from the toggle-on test above
    await app.request('/api/logs/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authCookie },
      body: JSON.stringify({ habitId, date: yesterday }),
    })

    const res = await app.request('/api/logs/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authCookie },
      body: JSON.stringify({ habitId, date: yesterday }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ completed: false })

    const rows = await db.select().from(habitLogs).where(
      and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, yesterday)),
    )
    expect(rows).toHaveLength(0)
  })

  it('rejects future dates with 400', async () => {
    const res = await app.request('/api/logs/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authCookie },
      body: JSON.stringify({ habitId, date: tomorrow }),
    })

    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('Cannot log future dates')
  })

  it('allows a past date', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
    const res = await app.request('/api/logs/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authCookie },
      body: JSON.stringify({ habitId, date: twoDaysAgo }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ completed: true })
  })

  it('returns 404 when a user tries to toggle another user\'s habit', async () => {
    const res = await app.request('/api/logs/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: user2Cookie },
      body: JSON.stringify({ habitId, date: today }),
    })

    expect(res.status).toBe(404)
  })
})
