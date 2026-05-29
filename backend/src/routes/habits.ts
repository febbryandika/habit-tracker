import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, max } from 'drizzle-orm'
import { db } from '../db'
import { habits as habitsTable } from '../db/schema'
import { requireAuth } from '../lib/middleware'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')

// Consistent { error, issues } shape on validation failure (matches the
// { error } convention used elsewhere).
const jsonBody = <T extends z.ZodType>(schema: T) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Invalid input', issues: result.error.issues }, 400)
    }
  })

const createHabit = z.object({
  name: z.string().trim().min(1).max(100),
  emoji: z.string().min(1).max(8).default('✅'),
  color: hexColor.default('#6366f1'),
})

// All habit routes require a session; every query is scoped by userId.
export const habitsRoutes = new Hono()
  .use(requireAuth)
  .post('/', jsonBody(createHabit), async (c) => {
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
