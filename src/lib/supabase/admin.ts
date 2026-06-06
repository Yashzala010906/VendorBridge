import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client that bypasses RLS. Server-only — never import into a
 * Client Component. Returns null when the key is not configured so callers can
 * fall back gracefully (the app works fully without it; it's only used for
 * admin user management / seeding).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
