import { Hono } from 'hono'
import { and, asc, count, eq, max } from 'drizzle-orm'
import { db } from '../db'
import { habits as habitsTable, habitLogs } from '../db/schema'
import { apiError, ErrorCode, validate } from '../lib/errors'
import { requireAuth } from '../lib/middleware'
import { computeStreaks } from '../lib/streaks'
import { createHabit, listQuery, updateHabit, reorderHabit } from '../lib/validation'

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
  .get('/:id/stats', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    // Verify ownership before reading any logs — never trust a client-supplied id.
    const habit = await db.query.habits.findFirst({
      where: and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)),
    })
    if (!habit) return apiError(c, 404, 'Habit not found', ErrorCode.NOT_FOUND)

    const logs = await db
      .select({ date: habitLogs.date })
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, id), eq(habitLogs.userId, user.id)))

    const dates = logs.map((l) => l.date)
    const dateSet = new Set(dates)
    const { current, longest } = computeStreaks(dates)

    // Last 84 days (12 weeks), oldest → today, for the heatmap grid.
    const heatmap: { date: string; completed: boolean }[] = []
    for (let i = 83; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      heatmap.push({ date, completed: dateSet.has(date) })
    }

    // Completion rate over the last 30 days — the trailing 30 heatmap cells.
    const last30 = heatmap.slice(-30).filter((cell) => cell.completed).length

    return c.json({
      current,
      longest,
      completionRate: last30 / 30,
      totalCompletions: dates.length,
      heatmap,
    })
  })
  .put('/:id', validate('json', updateHabit), async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const updates = c.req.valid('json')

    const [updated] = await db
      .update(habitsTable)
      .set(updates)
      .where(and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)))
      .returning()

    if (!updated) return apiError(c, 404, 'Habit not found', ErrorCode.NOT_FOUND)
    return c.json(updated)
  })
  .delete('/:id/archive', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    const [archived] = await db
      .update(habitsTable)
      .set({ isArchived: true })
      .where(and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)))
      .returning()

    if (!archived) return apiError(c, 404, 'Habit not found', ErrorCode.NOT_FOUND)
    return c.json(archived)
  })
  .delete('/:id/unarchive', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    const [restored] = await db
      .update(habitsTable)
      .set({ isArchived: false })
      .where(and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)))
      .returning()

    if (!restored) return apiError(c, 404, 'Habit not found', ErrorCode.NOT_FOUND)
    return c.json(restored)
  })
  .delete('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    const habit = await db.query.habits.findFirst({
      where: and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)),
    })
    if (!habit) return apiError(c, 404, 'Habit not found', ErrorCode.NOT_FOUND)

    const [logs] = await db
      .select({ value: count() })
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, id), eq(habitLogs.userId, user.id)))

    if ((logs?.value ?? 0) > 0) {
      return apiError(
        c,
        409,
        'Cannot delete a habit with logged completions; archive it instead',
        ErrorCode.CONFLICT,
      )
    }

    await db.delete(habitsTable).where(and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)))
    return c.json({ success: true })
  })
  .patch('/:id/order', validate('json', reorderHabit), async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const { sortOrder } = c.req.valid('json')

    const [updated] = await db
      .update(habitsTable)
      .set({ sortOrder })
      .where(and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)))
      .returning()

    if (!updated) return apiError(c, 404, 'Habit not found', ErrorCode.NOT_FOUND)
    return c.json(updated)
  })
