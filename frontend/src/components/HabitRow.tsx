import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { Habit } from '../hooks/useHabits'
import { useArchiveHabit, useDeleteHabit, useRestoreHabit } from '../hooks/useHabits'
import { ConfirmDialog } from './ConfirmDialog'

type PendingAction = 'archive' | 'restore' | 'delete'

const actionClass =
  'rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300'

export function HabitRow({
  habit,
  archived,
  dragHandle,
}: {
  habit: Habit
  archived: boolean
  dragHandle?: ReactNode
}) {
  const archiveHabit = useArchiveHabit()
  const restoreHabit = useRestoreHabit()
  const deleteHabit = useDeleteHabit()

  const [action, setAction] = useState<PendingAction | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function close() {
    setAction(null)
    setDeleteError(null)
  }

  const dialogs: Record<PendingAction, Parameters<typeof ConfirmDialog>[0]> = {
    archive: {
      open: action === 'archive',
      title: `Archive "${habit.name}"?`,
      message: "It'll move to your Archived list. You can restore it anytime.",
      confirmLabel: 'Archive',
      isPending: archiveHabit.isPending,
      onConfirm: () => {
        close()
        archiveHabit.mutate(habit.id)
      },
      onClose: close,
    },
    restore: {
      open: action === 'restore',
      title: `Restore "${habit.name}"?`,
      message: "It'll move back to your active habits.",
      confirmLabel: 'Restore',
      isPending: restoreHabit.isPending,
      onConfirm: () => {
        close()
        restoreHabit.mutate(habit.id)
      },
      onClose: close,
    },
    delete: {
      open: action === 'delete',
      title: `Delete "${habit.name}"?`,
      message: 'This permanently removes the habit and can’t be undone.',
      confirmLabel: 'Delete',
      danger: true,
      isPending: deleteHabit.isPending,
      error: deleteError,
      onConfirm: () =>
        deleteHabit.mutate(habit.id, {
          onSuccess: close,
          onError: (err) =>
            setDeleteError(err instanceof Error ? err.message : 'Could not delete habit'),
        }),
      onClose: close,
    },
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
      {dragHandle}
      <span className="text-xl leading-none" aria-hidden="true">
        {habit.emoji}
      </span>
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: habit.color }}
        aria-hidden="true"
      />
      <Link
        to="/habits/$habitId"
        params={{ habitId: habit.id }}
        className="min-w-0 flex-1 truncate font-medium text-slate-900 transition hover:text-indigo-600"
      >
        {habit.name}
      </Link>

      <div className="flex shrink-0 items-center gap-0.5">
        <Link to="/habits/$habitId/edit" params={{ habitId: habit.id }} className={actionClass}>
          Edit
        </Link>
        {archived ? (
          <button type="button" onClick={() => setAction('restore')} aria-label={`Restore ${habit.name}`} className={actionClass}>
            Restore
          </button>
        ) : (
          <button type="button" onClick={() => setAction('archive')} aria-label={`Archive ${habit.name}`} className={actionClass}>
            Archive
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setDeleteError(null)
            setAction('delete')
          }}
          aria-label={`Delete ${habit.name}`}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-300"
        >
          Delete
        </button>
      </div>

      <ConfirmDialog {...(action ? dialogs[action] : dialogs.archive)} open={action !== null} />
    </div>
  )
}
