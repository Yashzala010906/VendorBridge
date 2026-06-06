import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({
  value,
  showValue = true,
  className,
}: {
  value: number | null | undefined
  showValue?: boolean
  className?: string
}) {
  const v = Math.max(0, Math.min(5, Number(value ?? 0)))
  const full = Math.round(v)
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3.5 w-3.5',
              i < full ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
            )}
          />
        ))}
      </span>
      {showValue && <span className="text-xs font-medium text-slate-500">{v.toFixed(1)}</span>}
    </span>
  )
}
