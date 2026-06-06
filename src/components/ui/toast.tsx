'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'error'
export interface ToastData {
  id: number
  title: string
  description?: string
  variant?: Variant
}

let listeners: ((t: ToastData) => void)[] = []
let counter = 0

export function toast(input: { title: string; description?: string; variant?: Variant }) {
  const t: ToastData = { id: ++counter, ...input }
  listeners.forEach((l) => l(t))
}
toast.success = (title: string, description?: string) => toast({ title, description, variant: 'success' })
toast.error = (title: string, description?: string) => toast({ title, description, variant: 'error' })

const ICONS: Record<Variant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
}
const TONES: Record<Variant, string> = {
  default: 'text-brand-600',
  success: 'text-emerald-600',
  error: 'text-red-600',
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    const handler = (t: ToastData) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4500)
    }
    listeners.push(handler)
    return () => {
      listeners = listeners.filter((l) => l !== handler)
    }
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id))

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const variant = t.variant ?? 'default'
        const Icon = ICONS[variant]
        return (
          <div
            key={t.id}
            className="animate-in flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONES[variant])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
