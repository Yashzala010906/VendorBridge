'use client'

import { useEffect, useRef, useState } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { ROLE_LABELS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/db/types'

export function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-slate-100"
      >
        <Avatar name={profile.full_name || profile.email} className="h-8 w-8" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-slate-800">
            {profile.full_name || 'Account'}
          </span>
          <span className="block text-[11px] leading-tight text-slate-400">
            {ROLE_LABELS[profile.role]}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="animate-in absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-800">{profile.full_name}</p>
            <p className="truncate text-xs text-slate-400">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
