import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { habits as habitsTable, habitLogs } from '../db/schema'
import { apiError, ErrorCode, validate } from '../lib/errors'
import { requireAuth } from '../lib/middleware'
import { toggleLog } from '../lib/validation'

// Completion is the presence of a habit_logs row for (habitId, date):
// toggle on inserts, toggle off deletes. Every query is scoped by userId.
export const logsRoutes = new Hono()
  .use(requireAuth)
  .post('/toggle', validate('json', toggleLog), async (c) => {
    const user = c.get('user')
    const { habitId, date } = c.req.valid('json')

    // Reject future dates server-side (not just in the UI). Compared as
    // YYYY-MM-DD strings, which sort lexicographically the same as by date.
    const today = new Date().toISOString().slice(0, 10)
    if (date > today) return apiError(c, 400, 'Cannot log future dates', ErrorCode.BAD_REQUEST)

    // Never trust a client-supplied habitId: verify ownership before mutating.
    const habit = await db.query.habits.findFirst({
      where: and(eq(habitsTable.id, habitId), eq(habitsTable.userId, user.id)),
    })
    if (!habit) return apiError(c, 404, 'Habit not found', ErrorCode.NOT_FOUND)

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
