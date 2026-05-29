import { useState, type ChangeEvent, type FormEvent } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { authClient, signUp } from '../lib/auth-client'
import { fieldErrorsOf, registerSchema } from '../lib/auth-schemas'
import { TextField } from '../components/TextField'

const registerSearchSchema = z.object({ redirect: z.string().optional() })

export const Route = createFileRoute('/register')({
  validateSearch: (search) => registerSearchSchema.parse(search),
  beforeLoad: async ({ search }) => {
    const { data } = await authClient.getSession()
    if (data) throw redirect({ to: search.redirect ?? '/' })
  },
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error))
      return
    }
    setIsSubmitting(true)
    const { name, email, password } = parsed.data
    const result = await signUp.email({ name, email, password })
    setIsSubmitting(false)
    if (result.error) {
      setFormError(result.error.message ?? 'Could not create your account.')
      return
    }
    navigate({ to: search.redirect ?? '/' })
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Start tracking your habits.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <TextField
            id="name"
            name="name"
            label="Name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
          />
          <TextField
            id="email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <TextField
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />
          <TextField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            search={{ redirect: search.redirect }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
