import Link from 'next/link'
import { Plus, FileText, Search } from 'lucide-react'
import { getCurrentProfile, isStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { RFQ_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatDate, daysUntil } from '@/lib/utils'

export const metadata = { title: 'RFQs — VendorBridge' }

export default async function RfqsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const profile = (await getCurrentProfile())!
  const sp = await searchParams
  const supabase = await createClient()
  const staff = isStaff(profile.role)

  let query = supabase
    .from('rfqs')
    .select('id, rfq_number, title, category, status, deadline, created_at, rfq_items(count), quotations(count)')
    .order('created_at', { ascending: false })
  if (sp.q) query = query.ilike('title', `%${sp.q}%`)
  if (sp.status) query = query.eq('status', sp.status)
  const { data } = await query
  const rfqs = (data ?? []) as any[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests for Quotation"
        description={staff ? 'Create and manage your procurement requests.' : 'RFQs you have been invited to quote on.'}
      >
        {(profile.role === 'admin' || profile.role === 'procurement_officer') && (
          <Link href="/rfqs/new" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
            <Plus className="h-4 w-4" /> New RFQ
          </Link>
        )}
      </PageHeader>

      <Card>
        <form method="GET" className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Search by title…" className="pl-9" />
          </div>
          <Select name="status" defaultValue={sp.status ?? ''} className="w-auto">
            <option value="">All statuses</option>
            {Object.entries(RFQ_STATUS).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </Select>
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'md' })}>Filter</button>
          {(sp.q || sp.status) && (
            <Link href="/rfqs" className={buttonVariants({ variant: 'ghost', size: 'md' })}>Clear</Link>
          )}
        </form>

        {rfqs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={staff ? 'No RFQs yet' : 'No invitations yet'}
            description={staff ? 'Create your first request for quotation.' : 'When officers invite you to quote, RFQs appear here.'}
            action={
              (profile.role === 'admin' || profile.role === 'procurement_officer') ? (
                <Link href="/rfqs/new" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                  <Plus className="h-4 w-4" /> New RFQ
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>RFQ</TH>
                <TH>Category</TH>
                <TH>Deadline</TH>
                <TH className="text-center">Items</TH>
                <TH className="text-center">Quotes</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {rfqs.map((r) => {
                const left = daysUntil(r.deadline)
                return (
                  <TR key={r.id} className="hover:bg-slate-50">
                    <TD>
                      <Link href={`/rfqs/${r.id}`} className="block">
                        <span className="block font-medium text-slate-900">{r.title}</span>
                        <span className="block font-mono text-xs text-slate-400">{r.rfq_number}</span>
                      </Link>
                    </TD>
                    <TD>{r.category ?? '—'}</TD>
                    <TD>
                      <span className="text-sm text-slate-700">{formatDate(r.deadline)}</span>
                      {left !== null && r.status === 'published' && (
                        <span className={`block text-xs ${left < 0 ? 'text-red-500' : left <= 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {left < 0 ? `${Math.abs(left)}d overdue` : left === 0 ? 'due today' : `${left}d left`}
                        </span>
                      )}
                    </TD>
                    <TD className="text-center">{r.rfq_items?.[0]?.count ?? 0}</TD>
                    <TD className="text-center">{r.quotations?.[0]?.count ?? 0}</TD>
                    <TD><StatusBadge kind="rfq" value={r.status} /></TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
