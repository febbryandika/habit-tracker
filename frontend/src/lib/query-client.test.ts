import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MutationObserver } from '@tanstack/react-query'
import { ApiError } from './api-error'
import { createAppQueryClient } from './query-client'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (message: string) => mockToastSuccess(message),
    error: (message: string) => mockToastError(message),
  },
}))

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

async function runFailingQuery(router: unknown, error: Error) {
  const queryClient = createAppQueryClient(router as never)
  await queryClient
    .fetchQuery({ queryKey: ['x'], queryFn: () => Promise.reject(error), retry: false })
    .catch(() => {})
}

type MutationConfig = {
  mutationFn: () => Promise<unknown>
  meta?: { successMessage?: string; suppressErrorToast?: boolean }
}

async function runMutation(router: unknown, options: MutationConfig) {
  const queryClient = createAppQueryClient(router as never)
  const observer = new MutationObserver(queryClient, options as never)
  await observer.mutate(undefined as never).catch(() => {})
}

beforeEach(() => {
  mockToastSuccess.mockClear()
  mockToastError.mockClear()
})

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

describe('createAppQueryClient — mutation toasts', () => {
  it('toasts the meta success message on success', async () => {
    const { router } = mockRouter('/habits')
    await runMutation(router, { mutationFn: async () => 'ok', meta: { successMessage: 'Habit created' } })
    expect(mockToastSuccess).toHaveBeenCalledWith('Habit created')
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('toasts the error message on a non-401 failure', async () => {
    const { router } = mockRouter('/habits')
    await runMutation(router, {
      mutationFn: () => Promise.reject(new ApiError('Cannot delete', 409, 'CONFLICT')),
    })
    expect(mockToastError).toHaveBeenCalledWith('Cannot delete')
  })

  it('suppresses the error toast when meta.suppressErrorToast is set', async () => {
    const { router } = mockRouter('/habits')
    await runMutation(router, {
      mutationFn: () => Promise.reject(new ApiError('Cannot delete', 409, 'CONFLICT')),
      meta: { suppressErrorToast: true },
    })
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('redirects without toasting on a 401 mutation failure', async () => {
    const { router, navigations } = mockRouter('/habits')
    await runMutation(router, {
      mutationFn: () => Promise.reject(new ApiError('Unauthorized', 401, 'UNAUTHORIZED')),
    })
    expect(navigations).toEqual([{ to: '/login', search: { redirect: '/habits' } }])
    expect(mockToastError).not.toHaveBeenCalled()
  })
})
