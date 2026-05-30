import { createFileRoute, redirect } from '@tanstack/react-router'

// SPEC §6: "/" redirects to the dashboard.
export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
