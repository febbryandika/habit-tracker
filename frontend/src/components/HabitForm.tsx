import { useId, useRef, useState, type FormEvent } from 'react'
import { fieldErrorsOf } from '../lib/auth-schemas'
import { habitFormSchema, type HabitFormValues } from '../lib/habit-schemas'
import { TextField } from './TextField'

const DEFAULTS: HabitFormValues = { name: '', emoji: '✅', color: '#6366f1' }

const EMOJIS = ['✅', '🏃', '📚', '💧', '🧘', '💪', '🛌', '🥗', '🧹', '💰', '🎯', '🎨', '🎸', '🧠', '☀️', '🌙', '🚭', '📝', '🦷', '🚶']

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#14b8a6', '#3b82f6']

type HabitFormProps = {
  initialValues?: Partial<HabitFormValues>
  submitLabel: string
  isSubmitting: boolean
  formError?: string | null
  onSubmit: (values: HabitFormValues) => void
}

export function HabitForm({ initialValues, submitLabel, isSubmitting, formError, onSubmit }: HabitFormProps) {
  const [values, setValues] = useState<HabitFormValues>({ ...DEFAULTS, ...initialValues })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function setField<K extends keyof HabitFormValues>(key: K, value: HabitFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = habitFormSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error))
      return
    }
    onSubmit(parsed.data)
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <TextField
        id="name"
        name="name"
        label="Name"
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        error={errors.name}
        autoFocus
        maxLength={100}
        placeholder="e.g. Morning run"
      />

      <EmojiPicker value={values.emoji} onChange={(emoji) => setField('emoji', emoji)} />
      <ColorSwatches value={values.color} onChange={(color) => setField('color', color)} />

      {formError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}

function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const popoverId = useId()
  const popoverRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700">Icon</span>
      <button
        type="button"
        popoverTarget={popoverId}
        aria-label={`Icon: ${value}. Choose a different one`}
        className="anchor-emoji mt-1 grid size-11 place-items-center rounded-lg border border-slate-300 text-2xl shadow-sm transition hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-200"
      >
        <span aria-hidden="true">{value}</span>
      </button>

      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        className="popover-emoji rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200"
      >
        <div className="grid grid-cols-6 gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-pressed={value === emoji}
              aria-label={emoji}
              onClick={() => {
                onChange(emoji)
                popoverRef.current?.hidePopover()
              }}
              className="grid size-9 place-items-center rounded-md text-xl transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-200 aria-pressed:bg-indigo-100"
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div>
      <span className="block text-sm font-medium text-slate-700">Color</span>
      <div role="group" aria-label="Color" className="mt-1 flex flex-wrap gap-2">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            className="size-8 rounded-full ring-2 ring-transparent ring-offset-2 transition focus-visible:ring-slate-400 aria-pressed:ring-slate-900"
          />
        ))}
      </div>
    </div>
  )
}
