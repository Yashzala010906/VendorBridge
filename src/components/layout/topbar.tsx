'use client'

import Link from 'next/link'
import { Menu, Bell } from 'lucide-react'
import { UserMenu } from './user-menu'
import type { Profile } from '@/lib/db/types'

export function Topbar({
  profile,
  unreadCount,
  onMenu,
}: {
  profile: Profile
  unreadCount: number
  onMenu: () => void
}) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1" />

        <Link
          href="/activity"
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <UserMenu profile={profile} />
      </div>
    </header>
  )
}
