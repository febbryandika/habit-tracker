import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession()
    if (!data) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    // Exposed to child routes via Route.useRouteContext().
    return { user: data.user }
  },
  component: () => <Outlet />,
})
