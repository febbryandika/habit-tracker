// Decorative pulsing placeholder block. Compose these inside a container marked
// role="status" + aria-busy so assistive tech announces loading once, not per block.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-slate-200 ${className}`} />
}
