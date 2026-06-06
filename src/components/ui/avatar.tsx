import { cn, initials, hashIndex } from '@/lib/utils'

const COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
]

export function Avatar({ name, className }: { name: string | null | undefined; className?: string }) {
  const idx = hashIndex(name ?? '?', COLORS.length)
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        COLORS[idx],
        className
      )}
    >
      {initials(name)}
    </span>
  )
}
