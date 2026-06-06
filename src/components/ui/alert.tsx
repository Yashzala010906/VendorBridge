import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'info' | 'success' | 'error' | 'warning'
const META: Record<Tone, { cls: string; icon: typeof Info }> = {
  info: { cls: 'bg-blue-50 text-blue-800 ring-blue-200', icon: Info },
  success: { cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200', icon: CheckCircle2 },
  error: { cls: 'bg-red-50 text-red-800 ring-red-200', icon: AlertCircle },
  warning: { cls: 'bg-amber-50 text-amber-800 ring-amber-200', icon: TriangleAlert },
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone
  title?: string
  children?: React.ReactNode
  className?: string
}) {
  const { cls, icon: Icon } = META[tone]
  return (
    <div className={cn('flex gap-2.5 rounded-lg p-3 text-sm ring-1 ring-inset', cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  )
}
