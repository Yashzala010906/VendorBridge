import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, CalendarClock, Tag, Users, GitCompareArrows, Send,
  CheckCircle2, Lock, Trash2, FileText, Pencil,
} from 'lucide-react'
import { getCurrentProfile, isStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { Rating } from '@/components/ui/rating'
import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { ConfirmButton } from '@/components/forms/confirm-button'
import { publishRfq, closeRfq, deleteRfq } from '@/lib/actions/rfqs'
import { formatCurrency, formatDate, formatNumber, daysUntil } from '@/lib/utils'

export default async function RfqDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const profile = (await getCurrentProfile())!
  const staff = isStaff(profile.role)
  const canManage = profile.role === 'admin' || profile.role === 'procurement_officer'
  const supabase = await createClient()

  const { data: rfq } = await supabase.from('rfqs').select('*').eq('id', id).maybeSingle()
  if (!rfq) notFound()

  const { data: items } = await supabase
    .from('rfq_items').select('*').eq('rfq_id', id).order('position')

  const [{ data: invited }, { data: quotations }, { data: myQuote }] = await Promise.all([
    staff
      ? supabase.from('rfq_vendors').select('has_responded, vendor:vendors(id, name, rating, status)').eq('rfq_id', id)
      : Promise.resolve({ data: [] as any[] }),
    staff
      ? supabase.from('quotations').select('id, status, total_amount, delivery_days, vendor:vendors(id, name, rating)').eq('rfq_id', id).order('total_amount')
      : Promise.resolve({ data: [] as any[] }),
    !staff
      ? supabase.from('quotations').select('id, status, total_amount, delivery_days').eq('rfq_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const quotes = (quotations ?? []) as any[]
  const lowest = quotes.length ? Math.min(...quotes.map((q) => Number(q.total_amount))) : null
  const left = daysUntil(rfq.deadline)

  return (
    <div className="space-y-6">
      <Link href="/rfqs" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> RFQs
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-400">{rfq.rfq_number}</span>
            <StatusBadge kind="rfq" value={rfq.status} />
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{rfq.title}</h1>
          {rfq.description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{rfq.description}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {staff && quotes.length > 0 && (
            <Link href={`/rfqs/${id}/compare`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <GitCompareArrows className="h-4 w-4" /> Compare ({quotes.length})
            </Link>
          )}
          {canManage && rfq.status === 'draft' && (
            <ConfirmButton
              action={publishRfq.bind(null, id)}
              title="Publish RFQ?"
              message="Invited vendors will be notified and able to submit quotations."
              confirmLabel="Publish & notify"
              size="sm"
              trigger={<><Send className="h-4 w-4" /> Publish</>}
            />
          )}
          {canManage && rfq.status === 'published' && (
            <ConfirmButton
              action={closeRfq.bind(null, id)}
              title="Close RFQ?"
              message="Vendors will no longer be able to submit quotations."
              confirmLabel="Close RFQ"
              variant="outline"
              size="sm"
              trigger={<><Lock className="h-4 w-4" /> Close</>}
            />
          )}
          {canManage && (
            <ConfirmButton
              action={deleteRfq.bind(null, id)}
              title="Delete RFQ?"
              message="This permanently removes the RFQ and its items."
              confirmLabel="Delete"
              variant="danger"
              size="sm"
              trigger={<Trash2 className="h-4 w-4" />}
            />
          )}
        </div>
      </div>

      {error === 'novendors' && <Alert tone="warning">Invite at least one vendor before publishing this RFQ.</Alert>}
      {error === 'delete' && <Alert tone="error">Couldn&apos;t delete — this RFQ has linked quotations or orders.</Alert>}

      {/* Vendor call-to-action */}
      {!staff && (
        <Card className="border-brand-200 bg-brand-50/40">
          <CardContent className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            {myQuote ? (
              <>
                <div>
                  <p className="text-sm font-medium text-slate-900">You submitted a quotation</p>
                  <p className="text-sm text-slate-500">
                    {formatCurrency((myQuote as any).total_amount)} · {(myQuote as any).delivery_days ?? '—'} days ·{' '}
                    <StatusBadge kind="quotation" value={(myQuote as any).status} />
                  </p>
                </div>
                <Link href={`/quotations/${(myQuote as any).id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  <Pencil className="h-4 w-4" /> View / edit
                </Link>
              </>
            ) : rfq.status === 'published' ? (
              <>
                <div>
                  <p className="text-sm font-medium text-slate-900">Submit your quotation</p>
                  <p className="text-sm text-slate-500">Provide pricing and delivery terms for this request.</p>
                </div>
                <Link href={`/rfqs/${id}/quote`} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                  <Send className="h-4 w-4" /> Submit quotation
                </Link>
              </>
            ) : (
              <p className="text-sm text-slate-500">This RFQ is not currently open for quotations.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Line items */}
          <Card>
            <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
            <Table>
              <THead>
                <TR><TH>#</TH><TH>Product / service</TH><TH className="text-right">Quantity</TH><TH>Unit</TH></TR>
              </THead>
              <TBody>
                {(items ?? []).map((it: any, i: number) => (
                  <TR key={it.id}>
                    <TD className="text-slate-400">{i + 1}</TD>
                    <TD>
                      <span className="font-medium text-slate-900">{it.product_name}</span>
                      {it.description && <span className="block text-xs text-slate-400">{it.description}</span>}
                    </TD>
                    <TD className="text-right">{formatNumber(it.quantity)}</TD>
                    <TD>{it.unit}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>

          {/* Quotations (staff) */}
          {staff && (
            <Card>
              <CardHeader>
                <CardTitle>Quotations received ({quotes.length})</CardTitle>
                {quotes.length > 0 && (
                  <Link href={`/rfqs/${id}/compare`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                    <GitCompareArrows className="h-3.5 w-3.5" /> Compare
                  </Link>
                )}
              </CardHeader>
              {quotes.length === 0 ? (
                <EmptyState icon={FileText} title="No quotations yet" description="Submitted vendor quotations will appear here." />
              ) : (
                <Table>
                  <THead>
                    <TR><TH>Vendor</TH><TH className="text-right">Total</TH><TH className="text-center">Delivery</TH><TH>Status</TH><TH /></TR>
                  </THead>
                  <TBody>
                    {quotes.map((q) => (
                      <TR key={q.id} className="hover:bg-slate-50">
                        <TD>
                          <div className="flex items-center gap-2">
                            <Avatar name={q.vendor?.name} className="h-7 w-7 text-[10px]" />
                            <div>
                              <span className="block font-medium text-slate-900">{q.vendor?.name}</span>
                              <Rating value={q.vendor?.rating} />
                            </div>
                          </div>
                        </TD>
                        <TD className="text-right">
                          <span className="font-semibold text-slate-900">{formatCurrency(q.total_amount)}</span>
                          {Number(q.total_amount) === lowest && <Badge tone="green" className="ml-2">Lowest</Badge>}
                        </TD>
                        <TD className="text-center">{q.delivery_days ?? '—'} d</TD>
                        <TD><StatusBadge kind="quotation" value={q.status} /></TD>
                        <TD className="text-right">
                          <Link href={`/quotations/${q.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View</Link>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Meta icon={Tag} label="Category" value={rfq.category ?? '—'} />
              <Meta
                icon={CalendarClock}
                label="Deadline"
                value={
                  <span>
                    {formatDate(rfq.deadline)}
                    {left !== null && rfq.status === 'published' && (
                      <span className={`ml-2 text-xs ${left < 0 ? 'text-red-500' : left <= 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {left < 0 ? `${Math.abs(left)}d overdue` : left === 0 ? 'due today' : `${left}d left`}
                      </span>
                    )}
                  </span>
                }
              />
              <Meta icon={FileText} label="Created" value={formatDate(rfq.created_at)} />
            </CardContent>
          </Card>

          {staff && (
            <Card>
              <CardHeader>
                <CardTitle>Invited vendors</CardTitle>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Users className="h-3.5 w-3.5" /> {(invited ?? []).length}
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {(invited ?? []).length === 0 ? (
                  <p className="px-5 py-6 text-center text-sm text-slate-400">No vendors invited.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {(invited as any[]).map((row, i) => (
                      <li key={row.vendor?.id ?? i} className="flex items-center justify-between gap-2 px-5 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar name={row.vendor?.name} className="h-7 w-7 text-[10px]" />
                          <span className="truncate text-sm text-slate-700">{row.vendor?.name}</span>
                        </div>
                        {row.has_responded ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Responded
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Pending</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Meta({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-slate-400"><Icon className="h-4 w-4" /> {label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  )
}
