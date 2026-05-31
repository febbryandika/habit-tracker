import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { HabitCard } from './HabitCard'
import type { DashboardHabit } from './HabitCard'
import { client } from '../lib/client'

// Mock only the toggle API call — keep real useToggleCompletion + optimisticListUpdate.
vi.mock('../lib/client', () => ({
  client: {
    api: {
      logs: {
        toggle: {
          $post: vi.fn(),
        },
      },
    },
  },
}))

const mockPost = vi.mocked(client.api.logs.toggle.$post)

const baseHabit: DashboardHabit = {
  id: 'h1',
  name: 'Morning Run',
  emoji: '🏃',
  color: '#6366f1',
  sortOrder: 0,
  completedToday: false,
  currentStreak: 3,
}

// Wraps HabitCard in a QueryClientProvider and subscribes to the ['dashboard']
// cache so the card re-renders when the optimistic update fires.
function setup(habit: DashboardHabit = baseHabit) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  queryClient.setQueryData<DashboardHabit[]>(['dashboard'], [habit])

  function Wrapper() {
    // enabled: false — never fetches, but still subscribes to setQueryData updates.
    const { data = [] } = useQuery<DashboardHabit[]>({
      queryKey: ['dashboard'],
      queryFn: async () => [],
      enabled: false,
    })
    const h = data.find((d) => d.id === habit.id)
    return h ? <HabitCard habit={h} /> : null
  }

  render(
    <QueryClientProvider client={queryClient}>
      <Wrapper />
    </QueryClientProvider>,
  )

  return { button: () => screen.getByRole('button') }
}

describe('HabitCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('flips aria-pressed immediately (optimistic) before the request settles', async () => {
    // Never resolves — mutation stays pending so we can assert the optimistic state.
    mockPost.mockImplementation(() => new Promise(() => {}))

    const { button } = setup()
    expect(button()).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(button())

    await waitFor(() => expect(button()).toHaveAttribute('aria-pressed', 'true'))
  })

  it('rolls back to the original state when the request fails', async () => {
    mockPost.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error', code: 'INTERNAL_ERROR' }),
    } as never)

    const { button } = setup()
    await userEvent.click(button())

    // The optimistic flip and rollback happen in the same microtask batch before
    // React renders, so the intermediate true state is not observable in JSDOM.
    // What matters: after the failed mutation settles, state is restored to false.
    await waitFor(() => {
      expect(button()).not.toBeDisabled() // mutation settled
      expect(button()).toHaveAttribute('aria-pressed', 'false') // rolled back
    })
  })

  it('disables the button and sets aria-busy while the request is in flight', async () => {
    mockPost.mockImplementation(() => new Promise(() => {}))

    const { button } = setup()
    await userEvent.click(button())

    await waitFor(() => {
      expect(button()).toBeDisabled()
      expect(button()).toHaveAttribute('aria-busy', 'true')
    })
  })
})
