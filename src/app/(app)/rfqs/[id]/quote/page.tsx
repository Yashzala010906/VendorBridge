import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { QuotationForm } from '@/components/quotations/quotation-form'
import { submitQuotation } from '@/lib/actions/quotations'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Submit quotation — VendorBridge' }

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireUser()
  if (profile.role !== 'vendor' || !profile.vendor_id) redirect(`/rfqs/${id}`)

  const supabase = await createClient()
  const { data: rfq } = await supabase
    .from('rfqs').select('id, title, rfq_number, status, deadline').eq('id', id).maybeSingle()
  if (!rfq) notFound()
  if (rfq.status !== 'published') redirect(`/rfqs/${id}`)

  const { data: items } = await supabase
    .from('rfq_items').select('id, product_name, quantity, unit').eq('rfq_id', id).order('position')

  const { data: existing } = await supabase
    .from('quotations')
    .select('id, delivery_days, notes, quotation_items(rfq_item_id, unit_price)')
    .eq('rfq_id', id)
    .eq('vendor_id', profile.vendor_id)
    .maybeSingle()

  const prices: Record<string, number> = {}
  if (existing) {
    for (const qi of ((existing as any).quotation_items ?? [])) {
      if (qi.rfq_item_id) prices[qi.rfq_item_id] = Number(qi.unit_price)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/rfqs/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to RFQ
      </Link>
      <div>
        <span className="font-mono text-xs text-slate-400">{rfq.rfq_number}</span>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{existing ? 'Edit your quotation' : 'Submit quotation'}</h1>
        <p className="mt-1 text-sm text-slate-500">{rfq.title} · deadline {formatDate(rfq.deadline)}</p>
      </div>
      <QuotationForm
        rfqItems={(items ?? []) as any[]}
        initial={existing ? { delivery_days: (existing as any).delivery_days, notes: (existing as any).notes, prices } : undefined}
        action={submitQuotation.bind(null, id)}
        submitLabel={existing ? 'Update quotation' : 'Submit quotation'}
      />
    </div>
  )
}
