import Link from 'next/link'
import { Receipt } from 'lucide-react'
import { getCurrentProfile, isStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { INVOICE_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/select'
import { buttonVariants } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Invoices — VendorBridge' }

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const profile = (await getCurrentProfile())!
  const sp = await searchParams
  const staff = isStaff(profile.role)
  const supabase = await createClient()

  let query = supabase
    .from('invoices')
    .select('id, invoice_number, status, total_amount, issue_date, due_date, vendor:vendors(name)')
    .order('created_at', { ascending: false })
  if (sp.status) query = query.eq('status', sp.status)
  const { data } = await query
  const invoices = (data ?? []) as any[]

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description={staff ? 'Generated invoices and their status.' : 'Invoices issued to you.'} />

      <Card>
        <form method="GET" className="flex items-center gap-3 border-b border-slate-100 p-4">
          <Select name="status" defaultValue={sp.status ?? ''} className="w-auto">
            <option value="">All statuses</option>
            {Object.entries(INVOICE_STATUS).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </Select>
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'md' })}>Filter</button>
          {sp.status && <Link href="/invoices" className={buttonVariants({ variant: 'ghost', size: 'md' })}>Clear</Link>}
        </form>

        {invoices.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices" description="Invoices generated from purchase orders appear here." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Invoice</TH>
                {staff && <TH>Vendor</TH>}
                <TH className="text-right">Amount</TH>
                <TH>Issued</TH>
                <TH>Due</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {invoices.map((inv) => (
                <TR key={inv.id} className="hover:bg-slate-50">
                  <TD>
                    <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-medium text-brand-600">{inv.invoice_number}</Link>
                  </TD>
                  {staff && <TD>{inv.vendor?.name}</TD>}
                  <TD className="text-right font-semibold text-slate-900">{formatCurrency(inv.total_amount)}</TD>
                  <TD className="text-sm text-slate-500">{formatDate(inv.issue_date)}</TD>
                  <TD className="text-sm text-slate-500">{formatDate(inv.due_date)}</TD>
                  <TD><StatusBadge kind="invoice" value={inv.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
