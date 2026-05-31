import { z } from 'zod'
import { HEX_COLOR, HABIT_NAME_MAX, HABIT_EMOJI_MAX } from 'backend/validation'

// The form always supplies emoji + color (preset to the backend defaults), so
// both are required here rather than optional. Constraints shared with the backend.
export const habitFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(HABIT_NAME_MAX, `Keep it under ${HABIT_NAME_MAX} characters`),
  emoji: z.string().min(1, 'Pick an icon').max(HABIT_EMOJI_MAX),
  color: z.string().regex(HEX_COLOR, 'Pick a color'),
})

export type HabitFormValues = z.infer<typeof habitFormSchema>
