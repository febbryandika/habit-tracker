import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { habits as habitsTable, habitLogs } from '../db/schema'
import { requireAuth } from '../lib/middleware'

// Consistent { error, issues } shape on validation failure (matches habits.ts).
const validate = <T extends z.ZodType>(target: 'json', schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Invalid input', issues: result.error.issues }, 400)
    }
  })

const toggleLog = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
})

// Completion is the presence of a habit_logs row for (habitId, date):
// toggle on inserts, toggle off deletes. Every query is scoped by userId.
export const logsRoutes = new Hono()
  .use(requireAuth)
  .post('/toggle', validate('json', toggleLog), async (c) => {
    const user = c.get('user')
    const { habitId, date } = c.req.valid('json')

    // Never trust a client-supplied habitId: verify ownership before mutating.
    const habit = await db.query.habits.findFirst({
      where: and(eq(habitsTable.id, habitId), eq(habitsTable.userId, user.id)),
    })
    if (!habit) return c.json({ error: 'Habit not found' }, 404)

    const existing = await db.query.habitLogs.findFirst({
      where: and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.date, date),
        eq(habitLogs.userId, user.id),
      ),
    })

    if (existing) {
      await db.delete(habitLogs).where(eq(habitLogs.id, existing.id))
      return c.json({ completed: false })
    }

    // onConflictDoNothing guards the uq_habit_log unique constraint against races.
    await db
      .insert(habitLogs)
      .values({ habitId, date, userId: user.id })
      .onConflictDoNothing({ target: [habitLogs.habitId, habitLogs.date] })
    return c.json({ completed: true })
  })
