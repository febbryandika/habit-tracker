import { z } from 'zod'

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
export const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/
export const HABIT_NAME_MAX = 100
export const HABIT_EMOJI_MAX = 8
export const DEFAULT_EMOJI = '✅'
export const DEFAULT_COLOR = '#6366f1'

// True only for real calendar dates: rejects impossible dates like 2026-02-30
// or 2026-13-45 (the regex alone would let those through).
export const isRealDate = (date: string): boolean => {
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

const habitName = z.string().trim().min(1).max(HABIT_NAME_MAX)
const habitEmoji = z.string().min(1).max(HABIT_EMOJI_MAX)
const habitColor = z.string().regex(HEX_COLOR, 'Invalid hex color')

export const createHabit = z.object({
  name: habitName,
  emoji: habitEmoji.default(DEFAULT_EMOJI),
  color: habitColor.default(DEFAULT_COLOR),
})

export const listQuery = z.object({
  archived: z.enum(['true', 'false']).optional(),
})

export const updateHabit = z
  .object({
    name: habitName.optional(),
    emoji: habitEmoji.optional(),
    color: habitColor.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' })

export const reorderHabit = z.object({
  sortOrder: z.number().int().min(0),
})

export const toggleLog = z.object({
  habitId: z.string().min(1),
  date: z
    .string()
    .regex(DATE_FORMAT, 'Expected YYYY-MM-DD')
    .refine(isRealDate, 'Not a valid calendar date'),
})
