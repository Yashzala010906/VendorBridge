'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes } from 'lucide-react'
import { NAV_ITEMS, ROLE_LABELS } from '@/lib/constants'
import type { UserRole } from '@/lib/db/types'
import { cn } from '@/lib/utils'

export function Sidebar({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname()
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role))

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
          <Boxes className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-slate-900">VendorBridge</p>
          <p className="text-[11px] text-slate-400">Procurement ERP</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px]', active ? 'text-brand-600' : 'text-slate-400')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Signed in as</p>
        <p className="text-xs font-medium text-slate-600">{ROLE_LABELS[role]}</p>
      </div>
    </div>
  )
}
