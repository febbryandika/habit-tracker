import { describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'
import { habits } from '../db/schema'
import { createTestDb } from './db'

describe('PGlite test-DB harness', () => {
  it('migrates and round-trips a habits row', async () => {
    const { db, client } = await createTestDb()

    await db.insert(habits).values({ id: 'smoke-1', userId: 'user-1', name: 'Smoke test habit' })
    const rows = await db.select().from(habits).where(eq(habits.id, 'smoke-1'))

    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Smoke test habit')
    expect(rows[0].userId).toBe('user-1')
    expect(rows[0].isArchived).toBe(false)

    await client.close()
  })
})
