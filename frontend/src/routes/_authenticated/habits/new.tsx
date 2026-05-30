import { createFileRoute } from '@tanstack/react-router'

// Placeholder — the create form is built in the next task.
export const Route = createFileRoute('/_authenticated/habits/new')({
  component: () => (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">New habit</h1>
    </section>
  ),
})
