import { useEffect, useRef } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  isPending?: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

// Accessible modal built on the native <dialog> element: focus trapping, Escape
// to dismiss, and an inert backdrop come for free from showModal().
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  isPending = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        // Don't let Escape close the dialog while a mutation is in flight.
        if (isPending) event.preventDefault()
      }}
      className="m-auto w-full max-w-sm rounded-2xl p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-300'
                : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-300'
            }`}
          >
            {isPending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
