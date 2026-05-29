import type { ComponentProps } from 'react'

type TextFieldProps = ComponentProps<'input'> & {
  id: string
  label: string
  error?: string
}

export function TextField({ id, label, error, ...props }: TextFieldProps) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-200 aria-invalid:border-red-400 aria-invalid:focus-visible:border-red-500 aria-invalid:focus-visible:ring-red-200"
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
