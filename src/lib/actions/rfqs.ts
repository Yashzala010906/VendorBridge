'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { logActivity, notify } from '@/lib/activity'
import type { RfqStatus } from '@/lib/db/types'

export interface RfqFormState {
  error?: string
}

const OFFICERS = ['admin', 'procurement_officer'] as const

async function notifyInvitedVendors(rfqId: string, vendorIds: string[], rfqTitle: string) {
  if (vendorIds.length === 0) return
  const supabase = await createClient()
  const { data: profs } = await supabase.from('profiles').select('id').in('vendor_id', vendorIds)
  await notify(
    (profs ?? []).map((p) => p.id as string),
    {
      title: 'New RFQ invitation',
      message: `You've been invited to submit a quotation for "${rfqTitle}".`,
      type: 'rfq',
      link: `/rfqs/${rfqId}`,
    }
  )
}

function parseItems(fd: FormData) {
  const names = fd.getAll('item_name').map(String)
  const qtys = fd.getAll('item_qty').map(String)
  const units = fd.getAll('item_unit').map(String)
  const descs = fd.getAll('item_desc').map(String)
  return names
    .map((n, i) => ({
      product_name: n.trim(),
      quantity: Math.max(0.0001, Number(qtys[i] ?? 1) || 1),
      unit: (units[i] ?? 'unit').trim() || 'unit',
      description: (descs[i] ?? '').trim() || null,
      position: i,
    }))
    .filter((it) => it.product_name)
}

export async function createRfq(_prev: RfqFormState, formData: FormData): Promise<RfqFormState> {
  const profile = await requireRole([...OFFICERS])

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { error: 'RFQ title is required.' }

  const description = String(formData.get('description') ?? '').trim() || null
  const category = String(formData.get('category') ?? '').trim() || null
  const deadlineRaw = String(formData.get('deadline') ?? '')
  const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString() : null
  const status: RfqStatus = String(formData.get('status')) === 'published' ? 'published' : 'draft'

  const items = parseItems(formData)
  if (items.length === 0) return { error: 'Add at least one line item.' }

  const vendorIds = [...new Set(formData.getAll('vendor_ids').map(String).filter(Boolean))]
  if (status === 'published' && vendorIds.length === 0) {
    return { error: 'Select at least one vendor before publishing.' }
  }

  const supabase = await createClient()
  const { data: rfq, error } = await supabase
    .from('rfqs')
    .insert({ title, description, category, deadline, status, created_by: profile.id })
    .select('id, rfq_number')
    .single()
  if (error || !rfq) return { error: error?.message ?? 'Could not create RFQ.' }

  const { error: itErr } = await supabase
    .from('rfq_items')
    .insert(items.map((it) => ({ ...it, rfq_id: rfq.id })))
  if (itErr) return { error: itErr.message }

  if (vendorIds.length > 0) {
    await supabase.from('rfq_vendors').insert(vendorIds.map((vid) => ({ rfq_id: rfq.id, vendor_id: vid })))
  }

  await logActivity({
    action: status === 'published' ? 'rfq.published' : 'rfq.created',
    entityType: 'rfq',
    entityId: rfq.id,
    description: `RFQ "${title}" ${status === 'published' ? `published to ${vendorIds.length} vendor(s)` : 'saved as draft'}`,
  })
  if (status === 'published') await notifyInvitedVendors(rfq.id, vendorIds, title)

  revalidatePath('/rfqs')
  redirect(`/rfqs/${rfq.id}`)
}

export async function publishRfq(id: string) {
  await requireRole([...OFFICERS])
  const supabase = await createClient()

  const { data: invited } = await supabase.from('rfq_vendors').select('vendor_id').eq('rfq_id', id)
  if (!invited || invited.length === 0) redirect(`/rfqs/${id}?error=novendors`)

  const { data: rfq } = await supabase
    .from('rfqs')
    .update({ status: 'published' })
    .eq('id', id)
    .select('title')
    .single()

  await logActivity({ action: 'rfq.published', entityType: 'rfq', entityId: id, description: `RFQ "${rfq?.title}" published` })
  await notifyInvitedVendors(id, invited.map((i) => i.vendor_id as string), rfq?.title ?? 'RFQ')

  revalidatePath('/rfqs')
  revalidatePath(`/rfqs/${id}`)
  redirect(`/rfqs/${id}`)
}

export async function closeRfq(id: string) {
  await requireRole([...OFFICERS])
  const supabase = await createClient()
  await supabase.from('rfqs').update({ status: 'closed' }).eq('id', id)
  await logActivity({ action: 'rfq.closed', entityType: 'rfq', entityId: id, description: 'RFQ closed' })
  revalidatePath('/rfqs')
  revalidatePath(`/rfqs/${id}`)
  redirect(`/rfqs/${id}`)
}

export async function deleteRfq(id: string) {
  await requireRole([...OFFICERS])
  const supabase = await createClient()
  const { error } = await supabase.from('rfqs').delete().eq('id', id)
  if (error) redirect(`/rfqs/${id}?error=delete`)
  await logActivity({ action: 'rfq.deleted', entityType: 'rfq', entityId: id, description: 'RFQ deleted' })
  revalidatePath('/rfqs')
  redirect('/rfqs')
}
