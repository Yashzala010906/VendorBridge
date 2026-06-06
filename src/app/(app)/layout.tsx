import { requireUser } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser()

  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  return (
    <AppShell profile={profile} unreadCount={count ?? 0}>
      {children}
    </AppShell>
  )
}
