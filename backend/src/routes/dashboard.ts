import { Hono } from 'hono'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { habits as habitsTable, habitLogs } from '../db/schema'
import { requireAuth } from '../lib/middleware'
import { computeStreaks } from '../lib/streaks'

// Today's active habits with completion status and current streak.
// Two userId-scoped queries (habits + all logs), joined in memory — fine at
// personal scale and keeps streak math in the shared computeStreaks helper.
export const dashboardRoutes = new Hono().use(requireAuth).get('/', async (c) => {
  const user = c.get('user')
  const today = new Date().toISOString().slice(0, 10)

  const activeHabits = await db
    .select()
    .from(habitsTable)
    .where(and(eq(habitsTable.userId, user.id), eq(habitsTable.isArchived, false)))
    .orderBy(asc(habitsTable.sortOrder), asc(habitsTable.createdAt))

  const logs = await db
    .select({ habitId: habitLogs.habitId, date: habitLogs.date })
    .from(habitLogs)
    .where(eq(habitLogs.userId, user.id))

  const datesByHabit = new Map<string, string[]>()
  for (const { habitId, date } of logs) {
    const dates = datesByHabit.get(habitId)
    if (dates) dates.push(date)
    else datesByHabit.set(habitId, [date])
  }

  const result = activeHabits.map((habit) => {
    const dates = datesByHabit.get(habit.id) ?? []
    return {
      id: habit.id,
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      sortOrder: habit.sortOrder,
      completedToday: dates.includes(today),
      currentStreak: computeStreaks(dates).current,
    }
  })

  return c.json(result)
})
