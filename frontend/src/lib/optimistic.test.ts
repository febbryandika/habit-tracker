import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { optimisticListUpdate } from './optimistic'

type Row = { id: string }

function seed() {
  const queryClient = new QueryClient()
  const key = ['rows']
  queryClient.setQueryData<Row[]>(key, [{ id: 'a' }, { id: 'b' }])
  const handlers = optimisticListUpdate<Row[], string>(queryClient, key, (previous, id) =>
    previous?.filter((row) => row.id !== id),
  )
  return { queryClient, key, handlers }
}

describe('optimisticListUpdate', () => {
  it('applies the update and snapshots the previous value', async () => {
    const { queryClient, key, handlers } = seed()
    const context = await handlers.onMutate('a')
    expect(queryClient.getQueryData<Row[]>(key)).toEqual([{ id: 'b' }])
    expect(context.previous).toEqual([{ id: 'a' }, { id: 'b' }])
  })

  it('rolls back to the snapshot on error', async () => {
    const { queryClient, key, handlers } = seed()
    const context = await handlers.onMutate('a')
    handlers.onError(new Error('boom'), 'a', context)
    expect(queryClient.getQueryData<Row[]>(key)).toEqual([{ id: 'a' }, { id: 'b' }])
  })
})
