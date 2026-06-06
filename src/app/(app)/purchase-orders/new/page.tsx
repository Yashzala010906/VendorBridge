import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, PackageCheck } from 'lucide-react'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TAX_RATE } from '@/lib/constants'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { SubmitButton } from '@/components/forms/submit-button'
import { createPurchaseOrderFromApproval } from '@/lib/actions/purchase-orders'
import { formatCurrency, formatNumber } from '@/lib/utils'

export const metadata = { title: 'Create purchase order — VendorBridge' }

export default async function NewPoPage({
  searchParams,
}: {
  searchParams: Promise<{ approval?: string }>
}) {
  await requireRole(['admin', 'procurement_officer'])
  const { approval } = await searchParams
  if (!approval) redirect('/approvals')
  const supabase = await createClient()

  const { data: appr } = await supabase
    .from('approvals')
    .select('id, status, quotation_id, quotation:quotations(total_amount, delivery_days, vendor:vendors(name), quotation_items(product_name, quantity, unit_price, line_total)), rfq:rfqs(title, rfq_number)')
    .eq('id', approval)
    .maybeSingle()
  if (!appr) notFound()
  const a = appr as any
  if (a.status !== 'approved') redirect(`/approvals/${approval}`)

  const { data: existingPo } = await supabase.from('purchase_orders').select('id').eq('quotation_id', a.quotation_id).maybeSingle()
  if (existingPo) redirect(`/purchase-orders/${existingPo.id}`)

  const subtotal = Number(a.quotation?.total_amount ?? 0)
  const taxAmount = Math.round(subtotal * DEFAULT_TAX_RATE) / 100
  const total = subtotal + taxAmount

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/approvals/${approval}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to approval
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Create purchase order</h1>
        <p className="mt-1 text-sm text-slate-500">
          Issue an official PO to <span className="font-medium text-slate-700">{a.quotation?.vendor?.name}</span> for {a.rfq?.title}.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
        <Table>
          <THead>
            <TR><TH>Item</TH><TH className="text-right">Qty</TH><TH className="text-right">Unit price</TH><TH className="text-right">Total</TH></TR>
          </THead>
          <TBody>
            {(a.quotation?.quotation_items ?? []).map((it: any, i: number) => (
              <TR key={i}>
                <TD className="font-medium text-slate-900">{it.product_name}</TD>
                <TD className="text-right">{formatNumber(it.quantity)}</TD>
                <TD className="text-right">{formatCurrency(it.unit_price)}</TD>
                <TD className="text-right font-medium">{formatCurrency(it.line_total)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <CardContent className="space-y-1.5 border-t border-slate-100">
          <Row label="Subtotal" value={formatCurrency(subtotal)} />
          <Row label={`Tax (${DEFAULT_TAX_RATE}%)`} value={formatCurrency(taxAmount)} />
          <Row label="Total" value={formatCurrency(total)} strong />
        </CardContent>
      </Card>

      <form action={createPurchaseOrderFromApproval.bind(null, approval)} className="flex justify-end">
        <SubmitButton size="lg">
          <PackageCheck className="h-4 w-4" /> Issue purchase order
        </SubmitButton>
      </form>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-500'}>{label}</span>
      <span className={strong ? 'text-base font-semibold text-slate-900' : 'text-sm text-slate-700'}>{value}</span>
    </div>
  )
}
