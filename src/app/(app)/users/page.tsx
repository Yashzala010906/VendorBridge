import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/dal'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Table, THead, TBody, TH, TD } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ROLE_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import type { UserRole } from '@/lib/db/types'

export const metadata = { title: 'Users — VendorBridge' }

export default async function UsersPage() {
  const profile = await requireUser()
  if (profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, phone, avatar_url, vendor_id, created_at')
    .order('created_at', { ascending: false })

  const userList = (users ?? []) as {
    id: string
    full_name: string
    email: string | null
    role: UserRole
    phone: string | null
    avatar_url: string | null
    vendor_id: string | null
    created_at: string
  }[]

  const roleTone: Record<UserRole, 'purple' | 'blue' | 'amber' | 'teal'> = {
    admin: 'purple',
    procurement_officer: 'blue',
    manager: 'amber',
    vendor: 'teal',
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage platform users and their roles." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>User</TH>
                <TH>Role</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Joined</TH>
              </tr>
            </THead>
            <TBody>
              {userList.length === 0 ? (
                <tr>
                  <TD colSpan={5} className="text-center text-slate-400 py-10">
                    No users found. Users will appear here after they sign up.
                  </TD>
                </tr>
              ) : (
                userList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name || 'U'} />
                        <span className="font-medium text-slate-800">{u.full_name || '—'}</span>
                      </div>
                    </TD>
                    <TD>
                      <Badge tone={roleTone[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    </TD>
                    <TD className="text-slate-500">{u.email ?? '—'}</TD>
                    <TD className="text-slate-500">{u.phone ?? '—'}</TD>
                    <TD className="text-slate-500 text-xs">{formatDateTime(u.created_at)}</TD>
                  </tr>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
