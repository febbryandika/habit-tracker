import { describe, expect, it } from 'bun:test'
import { ApiError } from './api-error'
import { createAppQueryClient } from './query-client'

function mockRouter(pathname: string) {
  const navigations: Array<{ to: string; search: { redirect: string } }> = []
  const router = {
    state: { location: { pathname, href: pathname } },
    navigate: (opts: { to: string; search: { redirect: string } }) => {
      navigations.push(opts)
      return Promise.resolve()
    },
  }
  return { router, navigations }
}

async function runFailingQuery(router: unknown, error: ApiError) {
  const queryClient = createAppQueryClient(router as never)
  await queryClient
    .fetchQuery({ queryKey: ['x'], queryFn: async () => Promise.reject(error), retry: false })
    .catch(() => {})
}

describe('createAppQueryClient — unauthorized handling', () => {
  it('redirects to /login with the current location on a 401', async () => {
    const { router, navigations } = mockRouter('/dashboard')
    await runFailingQuery(router, new ApiError('Unauthorized', 401, 'UNAUTHORIZED'))
    expect(navigations).toEqual([{ to: '/login', search: { redirect: '/dashboard' } }])
  })

  it('does not redirect on a non-401 error', async () => {
    const { router, navigations } = mockRouter('/dashboard')
    await runFailingQuery(router, new ApiError('Not found', 404, 'NOT_FOUND'))
    expect(navigations).toEqual([])
  })

  it('does not redirect when already on an auth screen', async () => {
    const { router, navigations } = mockRouter('/login')
    await runFailingQuery(router, new ApiError('Unauthorized', 401, 'UNAUTHORIZED'))
    expect(navigations).toEqual([])
  })
})
