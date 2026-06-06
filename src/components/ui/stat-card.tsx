import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'brand' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'slate'
const TONES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  slate: 'bg-slate-100 text-slate-600',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
  href,
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  tone?: Tone
  hint?: string
  href?: string
}) {
  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>}
      </div>
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', TONES[tone])}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  )

  const cls =
    'rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition'
  if (href) {
    return (
      <Link href={href} className={cn(cls, 'hover:border-brand-300 hover:shadow-md')}>
        {inner}
      </Link>
    )
  }
  return <div className={cls}>{inner}</div>
}
