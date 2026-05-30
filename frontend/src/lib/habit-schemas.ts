import { z } from 'zod'

// Mirrors the backend create/update validators (backend/src/routes/habits.ts).
// The form always supplies emoji + color (preset to the backend defaults), so
// both are required here rather than optional.
export const habitFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Keep it under 100 characters'),
  emoji: z.string().min(1, 'Pick an icon').max(8),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color'),
})

export type HabitFormValues = z.infer<typeof habitFormSchema>
