import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { client } from '../lib/client'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await client.api.health.$get()
      return res.json()
    },
  })

  const status = isPending ? '…' : isError ? 'unreachable' : data.status

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 text-slate-900">
      <div className="rounded-2xl bg-white px-8 py-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold tracking-tight">Habit Tracker</h1>
        <p className="mt-2 text-sm text-slate-500">
          API:{' '}
          <span className={isError ? 'font-medium text-red-600' : 'font-medium text-emerald-600'}>
            {status}
          </span>
        </p>
      </div>
    </main>
  )
}
