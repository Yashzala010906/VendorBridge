import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, X, Send, PackageCheck, ClipboardCheck, CircleDot } from 'lucide-react'
import { getCurrentProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { Rating } from '@/components/ui/rating'
import { Avatar } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/forms/submit-button'
import { decideApproval } from '@/lib/actions/approvals'
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils'

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = (await getCurrentProfile())!
  if (profile.role === 'vendor') notFound()
  const supabase = await createClient()

  const { data: appr } = await supabase
    .from('approvals')
    .select('*, quotation:quotations(id, quotation_number, total_amount, delivery_days, notes, status, vendor:vendors(name, rating), quotation_items(product_name, quantity, unit_price, line_total)), rfq:rfqs(id, title, rfq_number)')
    .eq('id', id)
    .maybeSingle()
  if (!appr) notFound()
  const a = appr as any

  // resolve actor names + any PO created from this quotation
  const ids = [a.requested_by, a.decided_by].filter(Boolean)
  const [{ data: people }, { data: po }] = await Promise.all([
    ids.length ? supabase.from('profiles').select('id, full_name').in('id', ids) : Promise.resolve({ data: [] as any[] }),
    supabase.from('purchase_orders').select('id, po_number').eq('quotation_id', a.quotation_id).maybeSingle(),
  ])
  const nameOf = (uid: string | null) => (people ?? []).find((p: any) => p.id === uid)?.full_name ?? 'A user'

  const canDecide = (profile.role === 'admin' || profile.role === 'manager') && a.status === 'pending'
  const canCreatePo = profile.role === 'admin' || profile.role === 'procurement_officer'

  return (
    <div className="space-y-6">
      <Link href="/approvals" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Approvals
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">{a.rfq?.rfq_number}</span>
            <StatusBadge kind="approval" value={a.status} />
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{a.rfq?.title}</h1>
          <p className="mt-1 text-sm text-slate-500">Quotation {a.quotation?.quotation_number} · {a.quotation?.vendor?.name}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quotation under review</CardTitle>
              <Link href={`/quotations/${a.quotation?.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-700">Open quotation</Link>
            </CardHeader>
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
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <span className="text-sm text-slate-500">Delivery in {a.quotation?.delivery_days ?? '—'} days</span>
              <span className="text-lg font-semibold text-slate-900">{formatCurrency(a.quotation?.total_amount)}</span>
            </div>
          </Card>

          {a.quotation?.notes && (
            <Card>
              <CardHeader><CardTitle>Vendor notes</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-600">{a.quotation.notes}</CardContent>
            </Card>
          )}

          {/* Decision */}
          {canDecide ? (
            <Card>
              <CardHeader><CardTitle>Make a decision</CardTitle></CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <Field label="Remarks (optional)" htmlFor="remarks">
                    <Textarea id="remarks" name="remarks" rows={3} placeholder="Add a note explaining your decision…" />
                  </Field>
                  <div className="flex justify-end gap-2">
                    <SubmitButton variant="danger" formAction={decideApproval.bind(null, id, 'rejected')}>
                      <X className="h-4 w-4" /> Reject
                    </SubmitButton>
                    <SubmitButton variant="success" formAction={decideApproval.bind(null, id, 'approved')}>
                      <Check className="h-4 w-4" /> Approve
                    </SubmitButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : a.status === 'approved' ? (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardContent className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-slate-900">This quotation is approved</p>
                  <p className="text-sm text-slate-500">{po ? 'A purchase order has been generated.' : 'Generate a purchase order to proceed.'}</p>
                </div>
                {po ? (
                  <Link href={`/purchase-orders/${po.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    <PackageCheck className="h-4 w-4" /> View PO {po.po_number}
                  </Link>
                ) : canCreatePo ? (
                  <Link href={`/purchase-orders/new?approval=${id}`} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                    <PackageCheck className="h-4 w-4" /> Create purchase order
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Sidebar: vendor + timeline */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Vendor</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar name={a.quotation?.vendor?.name} />
              <div>
                <p className="font-medium text-slate-900">{a.quotation?.vendor?.name}</p>
                <Rating value={a.quotation?.vendor?.rating} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <TimelineItem icon={Send} tone="text-blue-600" title="Sent for approval" by={nameOf(a.requested_by)} at={a.created_at} />
                {a.status === 'pending' ? (
                  <TimelineItem icon={CircleDot} tone="text-amber-500" title="Awaiting decision" muted />
                ) : (
                  <TimelineItem
                    icon={a.status === 'approved' ? Check : X}
                    tone={a.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}
                    title={a.status === 'approved' ? 'Approved' : 'Rejected'}
                    by={nameOf(a.decided_by)}
                    at={a.decided_at}
                    remarks={a.remarks}
                  />
                )}
                {po && <TimelineItem icon={PackageCheck} tone="text-purple-600" title={`PO ${po.po_number} created`} />}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TimelineItem({
  icon: Icon, tone, title, by, at, remarks, muted,
}: {
  icon: typeof Check; tone: string; title: string; by?: string; at?: string; remarks?: string | null; muted?: boolean
}) {
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${muted ? 'text-slate-400' : 'text-slate-800'}`}>{title}</p>
        {by && <p className="text-xs text-slate-400">by {by}{at ? ` · ${formatDateTime(at)}` : ''}</p>}
        {remarks && <p className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">“{remarks}”</p>}
      </div>
    </li>
  )
}
