import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/db/types'
import { STAFF_ROLES } from '@/lib/constants'

/**
 * Current user's profile (role, vendor link, …), memoised for the request.
 * Returns null when not authenticated.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (data) return data as Profile

  // Resilience: synthesise a profile from the auth user if the row is missing.
  return {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) ?? '',
    email: user.email ?? null,
    role: ((user.user_metadata?.role as UserRole) ?? 'procurement_officer') as UserRole,
    vendor_id: null,
    phone: null,
    avatar_url: null,
    created_at: user.created_at,
    updated_at: user.created_at,
  }
})

/** Redirects to /login if not authenticated. */
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  return profile
}

/** Redirects to /dashboard if the user's role is not allowed. */
export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireUser()
  if (!roles.includes(profile.role)) redirect('/dashboard')
  return profile
}

export function isStaff(role: UserRole) {
  return STAFF_ROLES.includes(role)
}
