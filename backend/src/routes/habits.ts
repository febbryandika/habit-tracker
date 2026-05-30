import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, asc, count, eq, max } from 'drizzle-orm'
import { db } from '../db'
import { habits as habitsTable, habitLogs } from '../db/schema'
import { requireAuth } from '../lib/middleware'
import { computeStreaks } from '../lib/streaks'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')

// Consistent { error, issues } shape on validation failure (matches the
// { error } convention used elsewhere).
// `Target` must stay a literal ('json' | 'query'), not widen to the union —
// otherwise Hono RPC infers every route as validating both targets, corrupting
// the typed client (it would demand a bogus `query`/`json` on each call).
const validate = <Target extends 'json' | 'query', T extends z.ZodType>(target: Target, schema: T) =>
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

const updateHabit = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    emoji: z.string().min(1).max(8).optional(),
    color: hexColor.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' })

const reorderHabit = z.object({
  sortOrder: z.number().int().min(0),
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
  .get('/:id/stats', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    // Verify ownership before reading any logs — never trust a client-supplied id.
    const habit = await db.query.habits.findFirst({
      where: and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)),
    })
    if (!habit) return c.json({ error: 'Habit not found' }, 404)

    const logs = await db
      .select({ date: habitLogs.date })
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, id), eq(habitLogs.userId, user.id)))

    const dates = logs.map((l) => l.date)
    const dateSet = new Set(dates)
    const { current, longest } = computeStreaks(dates)

    // Completion rate over the last 30 days (today + prior 29), as a 0–1 fraction.
    let last30 = 0
    for (let i = 0; i < 30; i++) {
      const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (dateSet.has(day)) last30++
    }

    return c.json({
      current,
      longest,
      completionRate: last30 / 30,
      totalCompletions: dates.length,
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

    if (!updated) return c.json({ error: 'Habit not found' }, 404)
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

    if (!archived) return c.json({ error: 'Habit not found' }, 404)
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

    if (!restored) return c.json({ error: 'Habit not found' }, 404)
    return c.json(restored)
  })
  .delete('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    const habit = await db.query.habits.findFirst({
      where: and(eq(habitsTable.id, id), eq(habitsTable.userId, user.id)),
    })
    if (!habit) return c.json({ error: 'Habit not found' }, 404)

    const [logs] = await db
      .select({ value: count() })
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, id), eq(habitLogs.userId, user.id)))

    if ((logs?.value ?? 0) > 0) {
      return c.json({ error: 'Cannot delete a habit with logged completions; archive it instead' }, 409)
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

    if (!updated) return c.json({ error: 'Habit not found' }, 404)
    return c.json(updated)
  })
