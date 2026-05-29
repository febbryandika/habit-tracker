import { pgTable, text, boolean, integer, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const habits = pgTable(
  'habits',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    emoji: text('emoji').notNull().default('✅'),
    color: text('color').notNull().default('#6366f1'),
    sortOrder: integer('sort_order').notNull().default(0),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_habit_user').on(t.userId)],
)

export const habitLogs = pgTable(
  'habit_logs',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    date: text('date').notNull(), // 'YYYY-MM-DD'; completion = row exists (toggle deletes on off)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('uq_habit_log').on(t.habitId, t.date),
    index('idx_habit_log_user').on(t.userId),
    index('idx_habit_log_habit_date').on(t.habitId, t.date),
  ],
)

export type Habit = typeof habits.$inferSelect
export type NewHabit = typeof habits.$inferInsert
export type HabitLog = typeof habitLogs.$inferSelect
export type NewHabitLog = typeof habitLogs.$inferInsert
