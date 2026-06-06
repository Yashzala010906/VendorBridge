import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Receipt, Check, X, Truck, CalendarClock } from 'lucide-react'
import { getCurrentProfile, isStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Avatar } from '@/components/ui/avatar'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/forms/submit-button'
import { updatePoStatus } from '@/lib/actions/purchase-orders'
import { generateInvoiceFromPo } from '@/lib/actions/invoices'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'

export default async function PoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const profile = (await getCurrentProfile())!
  const canManage = profile.role === 'admin' || profile.role === 'procurement_officer'
  const supabase = await createClient()

  const { data: po } = await supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(id, name, email, phone, address, gst_number), rfq:rfqs(id, title, rfq_number)')
    .eq('id', id)
    .maybeSingle()
  if (!po) notFound()
  const p = po as any

  const [{ data: items }, { data: invoice }] = await Promise.all([
    supabase.from('po_items').select('*').eq('po_id', id),
    supabase.from('invoices').select('id, invoice_number, status').eq('po_id', id).maybeSingle(),
  ])

  return (
    <div className="space-y-6">
      <Link href="/purchase-orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Purchase Orders
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-900">{p.po_number}</span>
            <StatusBadge kind="po" value={p.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{p.rfq?.title} · {p.rfq?.rfq_number}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice ? (
            <Link href={`/invoices/${invoice.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Receipt className="h-4 w-4" /> View invoice
            </Link>
          ) : canManage && p.status !== 'cancelled' ? (
            <form action={generateInvoiceFromPo.bind(null, id)}>
              <SubmitButton size="sm"><Receipt className="h-4 w-4" /> Generate invoice</SubmitButton>
            </form>
          ) : null}
        </div>
      </div>

      {error === 'invoice' && <Alert tone="error">Couldn&apos;t generate the invoice. Please try again.</Alert>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Order items</CardTitle></CardHeader>
            <Table>
              <THead>
                <TR><TH>Item</TH><TH className="text-right">Qty</TH><TH className="text-right">Unit price</TH><TH className="text-right">Total</TH></TR>
              </THead>
              <TBody>
                {(items ?? []).map((it: any) => (
                  <TR key={it.id}>
                    <TD className="font-medium text-slate-900">{it.product_name}</TD>
                    <TD className="text-right">{formatNumber(it.quantity)}</TD>
                    <TD className="text-right">{formatCurrency(it.unit_price)}</TD>
                    <TD className="text-right font-medium">{formatCurrency(it.line_total)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <CardContent className="space-y-1.5 border-t border-slate-100">
              <Row label="Subtotal" value={formatCurrency(p.subtotal)} />
              <Row label={`Tax (${p.tax_rate}%)`} value={formatCurrency(p.tax_amount)} />
              <Row label="Total" value={formatCurrency(p.total_amount)} strong />
            </CardContent>
          </Card>

          {canManage && p.status !== 'cancelled' && p.status !== 'fulfilled' && (
            <Card>
              <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {p.status === 'issued' && (
                  <form action={updatePoStatus.bind(null, id, 'acknowledged')}>
                    <SubmitButton variant="outline" size="sm"><Truck className="h-4 w-4" /> Mark acknowledged</SubmitButton>
                  </form>
                )}
                {(p.status === 'issued' || p.status === 'acknowledged') && (
                  <form action={updatePoStatus.bind(null, id, 'fulfilled')}>
                    <SubmitButton variant="success" size="sm"><Check className="h-4 w-4" /> Mark fulfilled</SubmitButton>
                  </form>
                )}
                <form action={updatePoStatus.bind(null, id, 'cancelled')}>
                  <SubmitButton variant="outline" size="sm" className="text-red-600"><X className="h-4 w-4" /> Cancel</SubmitButton>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Vendor</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar name={p.vendor?.name} />
                <p className="font-medium text-slate-900">{p.vendor?.name}</p>
              </div>
              {p.vendor?.gst_number && <p className="text-xs text-slate-500">GST: <span className="font-mono">{p.vendor.gst_number}</span></p>}
              {p.vendor?.email && <p className="text-sm text-slate-500">{p.vendor.email}</p>}
              {p.vendor?.address && <p className="text-sm text-slate-500">{p.vendor.address}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Meta icon={CalendarClock} label="Expected delivery" value={formatDate(p.expected_delivery)} />
              <Meta icon={CalendarClock} label="Issued" value={formatDate(p.created_at)} />
            </CardContent>
          </Card>
        </div>
      </div>
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

function Meta({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-slate-400"><Icon className="h-4 w-4" /> {label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}
