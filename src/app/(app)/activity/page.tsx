import Link from 'next/link'
import {
  Bell, Activity, FileText, ReceiptText, ClipboardCheck,
  PackageCheck, Receipt, Building2, Check, CheckCheck,
} from 'lucide-react'
import { getCurrentProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SubmitButton } from '@/components/forms/submit-button'
import { cn, formatRelative, formatDateTime } from '@/lib/utils'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notifications'

export const metadata = { title: 'Activity — VendorBridge' }

function actionMeta(action: string) {
  if (action.startsWith('rfq')) return { icon: FileText, cls: 'text-blue-600 bg-blue-50' }
  if (action.startsWith('quotation')) return { icon: ReceiptText, cls: 'text-indigo-600 bg-indigo-50' }
  if (action.startsWith('approval')) return { icon: ClipboardCheck, cls: 'text-amber-600 bg-amber-50' }
  if (action.startsWith('po')) return { icon: PackageCheck, cls: 'text-purple-600 bg-purple-50' }
  if (action.startsWith('invoice')) return { icon: Receipt, cls: 'text-emerald-600 bg-emerald-50' }
  if (action.startsWith('vendor')) return { icon: Building2, cls: 'text-slate-600 bg-slate-100' }
  return { icon: Activity, cls: 'text-slate-600 bg-slate-100' }
}

export default async function ActivityPage() {
  const profile = (await getCurrentProfile())!
  const supabase = await createClient()

  const [{ data: notifications }, { data: logs }] = await Promise.all([
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(40),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(60),
  ])

  const actorIds = [...new Set((logs ?? []).map((l: any) => l.actor_id).filter(Boolean))]
  const { data: actors } = actorIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', actorIds)
    : { data: [] as any[] }
  const actorName = (uid: string | null) =>
    uid ? (actors ?? []).find((a: any) => a.id === uid)?.full_name ?? 'A user' : 'System'

  const unread = (notifications ?? []).filter((n: any) => !n.is_read).length

  return (
    <div className="space-y-6">
      <PageHeader title="Activity & Notifications" description="Stay on top of procurement updates." />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Notifications */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Notifications {unread > 0 && <span className="text-slate-400">· {unread} unread</span>}</CardTitle>
            {unread > 0 && (
              <form action={markAllNotificationsRead}>
                <SubmitButton variant="ghost" size="sm"><CheckCheck className="h-4 w-4" /> Mark all read</SubmitButton>
              </form>
            )}
          </CardHeader>
          {(notifications ?? []).length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="Updates relevant to you will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {(notifications as any[]).map((n) => (
                <li key={n.id} className={cn('flex items-start gap-3 px-5 py-3', !n.is_read && 'bg-brand-50/40')}>
                  <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.is_read ? 'bg-transparent' : 'bg-brand-500')} />
                  <div className="min-w-0 flex-1">
                    {n.link ? (
                      <Link href={n.link} className="block">
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        {n.message && <p className="text-sm text-slate-500">{n.message}</p>}
                      </Link>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        {n.message && <p className="text-sm text-slate-500">{n.message}</p>}
                      </>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">{formatRelative(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <form action={markNotificationRead.bind(null, n.id)}>
                      <button type="submit" className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600" aria-label="Mark read">
                        <Check className="h-4 w-4" />
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Activity log */}
        <Card className="flex flex-col">
          <CardHeader><CardTitle>Activity log</CardTitle></CardHeader>
          {(logs ?? []).length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" description="Procurement actions are recorded here." />
          ) : (
            <CardContent className="p-0">
              <ol className="divide-y divide-slate-100">
                {(logs as any[]).map((l) => {
                  const { icon: Icon, cls } = actionMeta(l.action)
                  return (
                    <li key={l.id} className="flex gap-3 px-5 py-3">
                      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', cls)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800">{l.description ?? l.action}</p>
                        <p className="text-xs text-slate-400" title={formatDateTime(l.created_at)}>
                          {actorName(l.actor_id)} · {formatRelative(l.created_at)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
