'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/dal'
import { logActivity, notify, notifyRoles } from '@/lib/activity'

export interface QuotationFormState {
  error?: string
}

export async function submitQuotation(
  rfqId: string,
  _prev: QuotationFormState,
  formData: FormData
): Promise<QuotationFormState> {
  const profile = await requireUser()
  if (profile.role !== 'vendor' || !profile.vendor_id) {
    return { error: 'Only vendor accounts can submit quotations.' }
  }
  const supabase = await createClient()

  const { data: rfq } = await supabase.from('rfqs').select('id, title, status').eq('id', rfqId).maybeSingle()
  if (!rfq) return { error: 'RFQ not found.' }
  if (rfq.status !== 'published') return { error: 'This RFQ is not open for quotations.' }

  const deliveryDays = Number(formData.get('delivery_days') ?? 0) || null
  const notes = String(formData.get('notes') ?? '').trim() || null

  const itemIds = formData.getAll('qi_id').map(String)
  const names = formData.getAll('qi_name').map(String)
  const qtys = formData.getAll('qi_qty').map(String)
  const prices = formData.getAll('qi_price').map(String)

  const items = names.map((n, i) => {
    const quantity = Number(qtys[i] ?? 1) || 0
    const unit_price = Math.max(0, Number(prices[i] ?? 0) || 0)
    return {
      rfq_item_id: itemIds[i] || null,
      product_name: n,
      quantity,
      unit_price,
      line_total: Math.round(quantity * unit_price * 100) / 100,
    }
  })
  if (items.length === 0) return { error: 'No line items to price.' }
  const total = items.reduce((s, it) => s + it.line_total, 0)

  const { data: existing } = await supabase
    .from('quotations')
    .select('id')
    .eq('rfq_id', rfqId)
    .eq('vendor_id', profile.vendor_id)
    .maybeSingle()

  let quotationId: string
  const payload = {
    status: 'submitted' as const,
    delivery_days: deliveryDays,
    notes,
    total_amount: total,
    submitted_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase.from('quotations').update(payload).eq('id', existing.id)
    if (error) return { error: error.message }
    quotationId = existing.id
    await supabase.from('quotation_items').delete().eq('quotation_id', quotationId)
  } else {
    const { data: created, error } = await supabase
      .from('quotations')
      .insert({ rfq_id: rfqId, vendor_id: profile.vendor_id, ...payload })
      .select('id')
      .single()
    if (error || !created) return { error: error?.message ?? 'Could not submit quotation.' }
    quotationId = created.id
  }

  const { error: itErr } = await supabase
    .from('quotation_items')
    .insert(items.map((it) => ({ ...it, quotation_id: quotationId })))
  if (itErr) return { error: itErr.message }

  await logActivity({
    action: 'quotation.submitted',
    entityType: 'quotation',
    entityId: quotationId,
    description: `Quotation submitted for "${rfq.title}"`,
  })
  await notifyRoles(['admin', 'procurement_officer'], {
    title: 'New quotation received',
    message: `A vendor submitted a quotation for "${rfq.title}".`,
    type: 'quotation',
    link: `/rfqs/${rfqId}/compare`,
  })

  revalidatePath(`/rfqs/${rfqId}`)
  revalidatePath('/quotations')
  redirect(`/quotations/${quotationId}`)
}

/** Staff shortlist / set a quotation status during review. */
export async function setQuotationStatus(
  id: string,
  status: 'under_review' | 'shortlisted' | 'rejected' | 'submitted'
) {
  await requireUser()
  const supabase = await createClient()
  const { data: q } = await supabase.from('quotations').select('rfq_id').eq('id', id).maybeSingle()
  await supabase.from('quotations').update({ status }).eq('id', id)
  await logActivity({ action: `quotation.${status}`, entityType: 'quotation', entityId: id, description: `Quotation marked ${status.replace('_', ' ')}` })
  if (q?.rfq_id) revalidatePath(`/rfqs/${q.rfq_id}/compare`)
  revalidatePath(`/quotations/${id}`)
}
