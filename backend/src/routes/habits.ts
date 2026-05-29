import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, asc, eq, max } from 'drizzle-orm'
import { db } from '../db'
import { habits as habitsTable } from '../db/schema'
import { requireAuth } from '../lib/middleware'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')

// Consistent { error, issues } shape on validation failure (matches the
// { error } convention used elsewhere).
const validate = <T extends z.ZodType>(target: 'json' | 'query', schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Invalid input', issues: result.error.issues }, 400)
    }
  })

const createHabit = z.object({
  name: z.string().trim().min(1).max(100),
  emoji: z.string().min(1).max(8).default('✅'),
  color: hexColor.default('#6366f1'),
})

const listQuery = z.object({
  archived: z.enum(['true', 'false']).optional(),
})

// All habit routes require a session; every query is scoped by userId.
export const habitsRoutes = new Hono()
  .use(requireAuth)
  .post('/', validate('json', createHabit), async (c) => {
    const user = c.get('user')
    const { name, emoji, color } = c.req.valid('json')

    const [current] = await db
      .select({ value: max(habitsTable.sortOrder) })
      .from(habitsTable)
      .where(eq(habitsTable.userId, user.id))

    const [created] = await db
      .insert(habitsTable)
      .values({ userId: user.id, name, emoji, color, sortOrder: (current?.value ?? -1) + 1 })
      .returning()

    return c.json(created, 201)
  })
  .get('/', validate('query', listQuery), async (c) => {
    const user = c.get('user')
    const { archived } = c.req.valid('query')

    const rows = await db
      .select()
      .from(habitsTable)
      .where(and(eq(habitsTable.userId, user.id), eq(habitsTable.isArchived, archived === 'true')))
      .orderBy(asc(habitsTable.sortOrder), asc(habitsTable.createdAt))

    return c.json(rows)
  })
