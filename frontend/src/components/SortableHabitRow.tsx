import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Habit } from '../hooks/useHabits'
import { HabitRow } from './HabitRow'

// Wraps HabitRow as a sortable item: the <li> is the draggable node, and the
// grip button is the activator (pointer + keyboard via dnd-kit's listeners).
export function SortableHabitRow({ habit }: { habit: Habit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10 opacity-80' : undefined}
    >
      <HabitRow
        habit={habit}
        archived={false}
        dragHandle={
          <button
            type="button"
            aria-label={`Reorder ${habit.name}`}
            className="-ml-1 cursor-grab touch-none rounded-md p-1 text-slate-400 transition hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-300 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden="true">
              <circle cx="7" cy="5" r="1.5" />
              <circle cx="13" cy="5" r="1.5" />
              <circle cx="7" cy="10" r="1.5" />
              <circle cx="13" cy="10" r="1.5" />
              <circle cx="7" cy="15" r="1.5" />
              <circle cx="13" cy="15" r="1.5" />
            </svg>
          </button>
        }
      />
    </li>
  )
}
