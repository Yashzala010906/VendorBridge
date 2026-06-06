import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Send, Check, Trophy } from 'lucide-react'
import { requireRole, getCurrentProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { STAFF_ROLES } from '@/lib/constants'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rating } from '@/components/ui/rating'
import { Avatar } from '@/components/ui/avatar'
import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/select'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/forms/submit-button'
import { StatusBadge } from '@/components/ui/status-badge'
import { requestApproval } from '@/lib/actions/approvals'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sort?: string; error?: string }>
}) {
  await requireRole(STAFF_ROLES)
  const { id } = await params
  const { sort = 'price', error } = await searchParams
  const profile = (await getCurrentProfile())!
  const canRequest = profile.role === 'admin' || profile.role === 'procurement_officer'
  const supabase = await createClient()

  const { data: rfq } = await supabase.from('rfqs').select('id, title, rfq_number, status').eq('id', id).maybeSingle()
  if (!rfq) notFound()

  const { data: items } = await supabase.from('rfq_items').select('id, product_name, quantity, unit').eq('rfq_id', id).order('position')
  const { data: quotationData } = await supabase
    .from('quotations')
    .select('id, status, total_amount, delivery_days, vendor:vendors(id, name, rating, status), quotation_items(rfq_item_id, unit_price)')
    .eq('rfq_id', id)

  let quotes = (quotationData ?? []) as any[]
  // sort
  quotes = [...quotes].sort((a, b) => {
    if (sort === 'delivery') return (a.delivery_days ?? 1e9) - (b.delivery_days ?? 1e9)
    if (sort === 'rating') return (b.vendor?.rating ?? 0) - (a.vendor?.rating ?? 0)
    return Number(a.total_amount) - Number(b.total_amount)
  })

  // price lookup: quotationId -> { rfqItemId -> unit_price }
  const priceMap = new Map<string, Map<string, number>>()
  for (const q of quotes) {
    const m = new Map<string, number>()
    for (const qi of q.quotation_items ?? []) if (qi.rfq_item_id) m.set(qi.rfq_item_id, Number(qi.unit_price))
    priceMap.set(q.id, m)
  }

  const minTotal = quotes.length ? Math.min(...quotes.map((q) => Number(q.total_amount))) : 0
  const minDelivery = quotes.length ? Math.min(...quotes.map((q) => q.delivery_days ?? 1e9)) : 0
  const maxRating = quotes.length ? Math.max(...quotes.map((q) => Number(q.vendor?.rating ?? 0))) : 0
  const minPriceForItem = (itemId: string) => {
    const vals = quotes.map((q) => priceMap.get(q.id)?.get(itemId)).filter((v): v is number => typeof v === 'number')
    return vals.length ? Math.min(...vals) : null
  }

  const hl = 'bg-emerald-50 font-semibold text-emerald-700'

  return (
    <div className="space-y-6">
      <Link href={`/rfqs/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to RFQ
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs text-slate-400">{rfq.rfq_number}</span>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Compare quotations</h1>
          <p className="mt-1 text-sm text-slate-500">{rfq.title}</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Sort by</label>
          <Select name="sort" defaultValue={sort} className="w-auto">
            <option value="price">Lowest price</option>
            <option value="delivery">Fastest delivery</option>
            <option value="rating">Highest rating</option>
          </Select>
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'md' })}>Apply</button>
        </form>
      </div>

      {error && <Alert tone="error">Couldn&apos;t send this quotation for approval. Please try again.</Alert>}

      {quotes.length === 0 ? (
        <Card>
          <EmptyState icon={Trophy} title="No quotations to compare" description="Vendors haven't submitted quotations for this RFQ yet." />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Vendor
                    </th>
                    {quotes.map((q) => (
                      <th key={q.id} className="border-b border-l border-slate-200 bg-slate-50 px-4 py-3 text-left align-bottom">
                        <div className="flex items-center gap-2">
                          <Avatar name={q.vendor?.name} className="h-7 w-7 text-[10px]" />
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{q.vendor?.name}</span>
                            <StatusBadge kind="vendor" value={q.vendor?.status} />
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <Metric label="Quotation total">
                    {quotes.map((q) => (
                      <Cell key={q.id} className={Number(q.total_amount) === minTotal ? hl : 'font-semibold text-slate-900'}>
                        {formatCurrency(q.total_amount)}
                        {Number(q.total_amount) === minTotal && <Badge tone="green" className="ml-2">Lowest</Badge>}
                      </Cell>
                    ))}
                  </Metric>

                  <Metric label="Delivery time">
                    {quotes.map((q) => (
                      <Cell key={q.id} className={(q.delivery_days ?? 1e9) === minDelivery ? hl : ''}>
                        {q.delivery_days ?? '—'} days
                      </Cell>
                    ))}
                  </Metric>

                  <Metric label="Vendor rating">
                    {quotes.map((q) => (
                      <Cell key={q.id} className={Number(q.vendor?.rating ?? 0) === maxRating ? hl : ''}>
                        <Rating value={q.vendor?.rating} />
                      </Cell>
                    ))}
                  </Metric>

                  {(items ?? []).map((it: any) => {
                    const min = minPriceForItem(it.id)
                    return (
                      <Metric key={it.id} label={`${it.product_name}`} sub={`${formatNumber(it.quantity)} ${it.unit}`}>
                        {quotes.map((q) => {
                          const price = priceMap.get(q.id)?.get(it.id)
                          return (
                            <Cell key={q.id} className={price != null && price === min ? hl : ''}>
                              {price != null ? formatCurrency(price) : '—'}
                            </Cell>
                          )
                        })}
                      </Metric>
                    )
                  })}

                  <tr>
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Decision
                    </td>
                    {quotes.map((q) => (
                      <td key={q.id} className="border-l border-slate-100 px-4 py-3 align-middle">
                        {q.status === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                            <Check className="h-4 w-4" /> Accepted
                          </span>
                        ) : q.status === 'shortlisted' ? (
                          <StatusBadge kind="quotation" value={q.status} />
                        ) : rfq.status === 'awarded' ? (
                          <span className="text-sm text-slate-400">—</span>
                        ) : canRequest ? (
                          <form action={requestApproval.bind(null, q.id)}>
                            <SubmitButton size="sm" variant="outline">
                              <Send className="h-3.5 w-3.5" /> For approval
                            </SubmitButton>
                          </form>
                        ) : (
                          <StatusBadge kind="quotation" value={q.status} />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-slate-400">
            <span className={cn('mr-1 inline-block h-3 w-3 rounded-sm align-middle', 'bg-emerald-100')} />
            Best value in each row is highlighted. Send a quotation for approval to start the workflow.
          </p>
        </>
      )}
    </div>
  )
}

function Metric({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="sticky left-0 z-10 bg-white px-4 py-3 align-top">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {sub && <span className="block text-xs text-slate-400">{sub}</span>}
      </td>
      {children}
    </tr>
  )
}

function Cell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <td className={cn('border-l border-slate-100 px-4 py-3 align-middle', className)}>{children}</td>
}
