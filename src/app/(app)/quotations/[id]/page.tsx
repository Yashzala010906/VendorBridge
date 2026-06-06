import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, GitCompareArrows, Truck, FileText } from 'lucide-react'
import { getCurrentProfile, isStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Rating } from '@/components/ui/rating'
import { Avatar } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = (await getCurrentProfile())!
  const staff = isStaff(profile.role)
  const supabase = await createClient()

  const { data: q } = await supabase
    .from('quotations')
    .select('*, rfq:rfqs(id, title, rfq_number, status), vendor:vendors(id, name, rating, status, email, phone)')
    .eq('id', id)
    .maybeSingle()
  if (!q) notFound()

  const { data: items } = await supabase.from('quotation_items').select('*').eq('quotation_id', id)
  const quote = q as any
  const canEdit = profile.role === 'vendor' && quote.vendor_id === profile.vendor_id && quote.rfq?.status === 'published'

  return (
    <div className="space-y-6">
      <Link href={staff ? `/rfqs/${quote.rfq?.id}` : '/quotations'} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> {staff ? 'Back to RFQ' : 'Quotations'}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-400">{quote.quotation_number}</span>
            <StatusBadge kind="quotation" value={quote.status} />
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{quote.rfq?.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{quote.rfq?.rfq_number}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/rfqs/${quote.rfq?.id}/quote`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
          {staff && (
            <Link href={`/rfqs/${quote.rfq?.id}/compare`} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
              <GitCompareArrows className="h-4 w-4" /> Compare
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <Table>
              <THead>
                <TR><TH>Product / service</TH><TH className="text-right">Qty</TH><TH className="text-right">Unit price</TH><TH className="text-right">Line total</TH></TR>
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
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-3">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-xl font-semibold tracking-tight text-slate-900">{formatCurrency(quote.total_amount)}</span>
            </div>
          </Card>

          {quote.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-600">{quote.notes}</CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Vendor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={quote.vendor?.name} />
                <div>
                  <p className="font-medium text-slate-900">{quote.vendor?.name}</p>
                  <Rating value={quote.vendor?.rating} />
                </div>
              </div>
              {quote.vendor?.email && <p className="text-sm text-slate-500">{quote.vendor.email}</p>}
              {quote.vendor?.phone && <p className="text-sm text-slate-500">{quote.vendor.phone}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-slate-400"><Truck className="h-4 w-4" /> Delivery</span>
                <span className="font-medium text-slate-800">{quote.delivery_days ?? '—'} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-slate-400"><FileText className="h-4 w-4" /> Submitted</span>
                <span className="font-medium text-slate-800">{formatDate(quote.submitted_at ?? quote.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
