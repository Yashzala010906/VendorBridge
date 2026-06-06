import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { STAFF_ROLES, APPROVAL_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/select'
import { buttonVariants } from '@/components/ui/button'
import { formatCurrency, formatRelative } from '@/lib/utils'

export const metadata = { title: 'Approvals — VendorBridge' }

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireRole(['admin', 'manager'])
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('approvals')
    .select('id, status, created_at, decided_at, quotation:quotations(total_amount, vendor:vendors(name)), rfq:rfqs(title, rfq_number)')
    .order('created_at', { ascending: false })
  if (sp.status) query = query.eq('status', sp.status)
  const { data } = await query
  const approvals = (data ?? []) as any[]

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" description="Review quotations and decide on procurement requests." />

      <Card>
        <form method="GET" className="flex items-center gap-3 border-b border-slate-100 p-4">
          <Select name="status" defaultValue={sp.status ?? ''} className="w-auto">
            <option value="">All statuses</option>
            {Object.entries(APPROVAL_STATUS).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </Select>
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'md' })}>Filter</button>
          {sp.status && <Link href="/approvals" className={buttonVariants({ variant: 'ghost', size: 'md' })}>Clear</Link>}
        </form>

        {approvals.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Nothing to approve" description="Quotations sent for approval will appear here." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>RFQ</TH>
                <TH>Vendor</TH>
                <TH className="text-right">Amount</TH>
                <TH>Requested</TH>
                <TH>Status</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {approvals.map((a) => (
                <TR key={a.id} className="hover:bg-slate-50">
                  <TD>
                    <span className="block font-medium text-slate-900">{a.rfq?.title}</span>
                    <span className="block font-mono text-xs text-slate-400">{a.rfq?.rfq_number}</span>
                  </TD>
                  <TD>{a.quotation?.vendor?.name}</TD>
                  <TD className="text-right font-semibold text-slate-900">{formatCurrency(a.quotation?.total_amount)}</TD>
                  <TD className="text-sm text-slate-500">{formatRelative(a.created_at)}</TD>
                  <TD><StatusBadge kind="approval" value={a.status} /></TD>
                  <TD className="text-right">
                    <Link href={`/approvals/${a.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                      {a.status === 'pending' ? 'Review' : 'View'}
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
