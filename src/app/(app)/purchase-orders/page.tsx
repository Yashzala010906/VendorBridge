import Link from 'next/link'
import { PackageCheck } from 'lucide-react'
import { getCurrentProfile, isStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PO_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/select'
import { buttonVariants } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Purchase Orders — VendorBridge' }

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const profile = (await getCurrentProfile())!
  const sp = await searchParams
  const staff = isStaff(profile.role)
  const supabase = await createClient()

  let query = supabase
    .from('purchase_orders')
    .select('id, po_number, status, total_amount, expected_delivery, created_at, vendor:vendors(name)')
    .order('created_at', { ascending: false })
  if (sp.status) query = query.eq('status', sp.status)
  const { data } = await query
  const pos = (data ?? []) as any[]

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" description={staff ? 'Official orders issued to vendors.' : 'Purchase orders issued to you.'} />

      <Card>
        <form method="GET" className="flex items-center gap-3 border-b border-slate-100 p-4">
          <Select name="status" defaultValue={sp.status ?? ''} className="w-auto">
            <option value="">All statuses</option>
            {Object.entries(PO_STATUS).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </Select>
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'md' })}>Filter</button>
          {sp.status && <Link href="/purchase-orders" className={buttonVariants({ variant: 'ghost', size: 'md' })}>Clear</Link>}
        </form>

        {pos.length === 0 ? (
          <EmptyState icon={PackageCheck} title="No purchase orders" description="Approved quotations become purchase orders here." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>PO</TH>
                {staff && <TH>Vendor</TH>}
                <TH className="text-right">Total</TH>
                <TH>Expected delivery</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {pos.map((po) => (
                <TR key={po.id} className="hover:bg-slate-50">
                  <TD>
                    <Link href={`/purchase-orders/${po.id}`} className="font-mono text-xs font-medium text-brand-600">{po.po_number}</Link>
                  </TD>
                  {staff && <TD>{po.vendor?.name}</TD>}
                  <TD className="text-right font-semibold text-slate-900">{formatCurrency(po.total_amount)}</TD>
                  <TD className="text-sm text-slate-500">{formatDate(po.expected_delivery)}</TD>
                  <TD><StatusBadge kind="po" value={po.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
