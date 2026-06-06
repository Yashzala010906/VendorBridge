import Link from 'next/link'
import { ReceiptText } from 'lucide-react'
import { getCurrentProfile, isStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { QUOTATION_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonVariants } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Quotations — VendorBridge' }

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const profile = (await getCurrentProfile())!
  const sp = await searchParams
  const staff = isStaff(profile.role)
  const supabase = await createClient()

  let query = supabase
    .from('quotations')
    .select('id, quotation_number, status, total_amount, delivery_days, created_at, rfq:rfqs(id, title, rfq_number), vendor:vendors(name)')
    .order('created_at', { ascending: false })
  if (sp.status) query = query.eq('status', sp.status)
  const { data } = await query
  const quotations = (data ?? []) as any[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description={staff ? 'All quotations submitted by vendors.' : 'Quotations you have submitted.'}
      />

      <Card>
        <form method="GET" className="flex items-center gap-3 border-b border-slate-100 p-4">
          <Select name="status" defaultValue={sp.status ?? ''} className="w-auto">
            <option value="">All statuses</option>
            {Object.entries(QUOTATION_STATUS).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </Select>
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'md' })}>Filter</button>
          {sp.status && <Link href="/quotations" className={buttonVariants({ variant: 'ghost', size: 'md' })}>Clear</Link>}
        </form>

        {quotations.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No quotations"
            description={staff ? 'Vendor quotations will appear here.' : 'Quotations you submit will appear here.'}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Quotation</TH>
                <TH>RFQ</TH>
                {staff && <TH>Vendor</TH>}
                <TH className="text-right">Total</TH>
                <TH className="text-center">Delivery</TH>
                <TH>Status</TH>
                <TH>Submitted</TH>
              </TR>
            </THead>
            <TBody>
              {quotations.map((q) => (
                <TR key={q.id} className="hover:bg-slate-50">
                  <TD>
                    <Link href={`/quotations/${q.id}`} className="font-mono text-xs font-medium text-brand-600">
                      {q.quotation_number}
                    </Link>
                  </TD>
                  <TD className="max-w-[220px]">
                    <span className="block truncate text-sm text-slate-700">{q.rfq?.title}</span>
                  </TD>
                  {staff && <TD>{q.vendor?.name}</TD>}
                  <TD className="text-right font-semibold text-slate-900">{formatCurrency(q.total_amount)}</TD>
                  <TD className="text-center">{q.delivery_days ?? '—'} d</TD>
                  <TD><StatusBadge kind="quotation" value={q.status} /></TD>
                  <TD className="text-sm text-slate-500">{formatDate(q.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
