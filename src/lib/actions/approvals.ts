'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { logActivity, notify, notifyRoles } from '@/lib/activity'

/** Officer sends a quotation into the approval workflow. */
export async function requestApproval(quotationId: string) {
  const profile = await requireRole(['admin', 'procurement_officer'])
  const supabase = await createClient()

  const { data: q } = await supabase
    .from('quotations')
    .select('id, rfq_id, rfq:rfqs(title)')
    .eq('id', quotationId)
    .maybeSingle()
  if (!q) redirect('/quotations')

  const { data: existing } = await supabase
    .from('approvals')
    .select('id')
    .eq('quotation_id', quotationId)
    .eq('status', 'pending')
    .maybeSingle()

  let approvalId = existing?.id as string | undefined
  if (!existing) {
    const { data: created, error } = await supabase
      .from('approvals')
      .insert({ quotation_id: quotationId, rfq_id: (q as any).rfq_id, status: 'pending', requested_by: profile.id })
      .select('id')
      .single()
    if (error || !created) redirect(`/rfqs/${(q as any).rfq_id}/compare?error=1`)
    approvalId = created.id
  }

  await supabase.from('quotations').update({ status: 'shortlisted' }).eq('id', quotationId)
  await logActivity({
    action: 'approval.requested',
    entityType: 'approval',
    entityId: approvalId!,
    description: `Approval requested for a quotation on "${(q as any).rfq?.title}"`,
  })
  await notifyRoles(['manager', 'admin'], {
    title: 'Approval requested',
    message: `A quotation for "${(q as any).rfq?.title}" is awaiting your approval.`,
    type: 'approval',
    link: `/approvals/${approvalId}`,
  })

  revalidatePath('/approvals')
  redirect(`/approvals/${approvalId}`)
}

/** Manager/Admin approves or rejects. Approval cascades to quotations + RFQ. */
export async function decideApproval(approvalId: string, decision: 'approved' | 'rejected', formData: FormData) {
  const profile = await requireRole(['admin', 'manager'])
  const remarks = String(formData.get('remarks') ?? '').trim() || null
  const supabase = await createClient()

  const { data: appr } = await supabase
    .from('approvals')
    .select('id, quotation_id, rfq_id, requested_by, quotation:quotations(vendor_id, rfq:rfqs(title))')
    .eq('id', approvalId)
    .maybeSingle()
  if (!appr) redirect('/approvals')
  const a = appr as any

  await supabase
    .from('approvals')
    .update({ status: decision, remarks, decided_by: profile.id, decided_at: new Date().toISOString() })
    .eq('id', approvalId)

  if (decision === 'approved') {
    await supabase.from('quotations').update({ status: 'accepted' }).eq('id', a.quotation_id)
    await supabase
      .from('quotations')
      .update({ status: 'rejected' })
      .eq('rfq_id', a.rfq_id)
      .neq('id', a.quotation_id)
    await supabase.from('rfqs').update({ status: 'awarded' }).eq('id', a.rfq_id)
  } else {
    await supabase.from('quotations').update({ status: 'rejected' }).eq('id', a.quotation_id)
  }

  await logActivity({
    action: `approval.${decision}`,
    entityType: 'approval',
    entityId: approvalId,
    description: `Quotation ${decision} for "${a.quotation?.rfq?.title}"`,
  })

  // Notify the requesting officer and the vendor's users.
  const { data: vendorUsers } = await supabase.from('profiles').select('id').eq('vendor_id', a.quotation?.vendor_id ?? '')
  const recipients = [a.requested_by, ...((vendorUsers ?? []).map((u) => u.id as string))]
  await notify(recipients, {
    title: decision === 'approved' ? 'Quotation approved' : 'Quotation rejected',
    message: `A quotation for "${a.quotation?.rfq?.title}" was ${decision}.`,
    type: 'approval',
    link: `/approvals/${approvalId}`,
  })

  revalidatePath('/approvals')
  revalidatePath(`/approvals/${approvalId}`)
  redirect(`/approvals/${approvalId}`)
}
