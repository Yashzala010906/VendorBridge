'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { logActivity, notify } from '@/lib/activity'
import { DEFAULT_TAX_RATE } from '@/lib/constants'
import type { PoStatus } from '@/lib/db/types'

const OFFICERS = ['admin', 'procurement_officer'] as const

/** Convert an approved quotation into a Purchase Order. */
export async function createPurchaseOrderFromApproval(approvalId: string) {
  const profile = await requireRole([...OFFICERS])
  const supabase = await createClient()

  const { data: appr } = await supabase
    .from('approvals')
    .select('id, status, quotation_id, rfq_id, quotation:quotations(vendor_id, total_amount, delivery_days, quotation_items(product_name, quantity, unit_price, line_total))')
    .eq('id', approvalId)
    .maybeSingle()
  if (!appr) redirect('/approvals')
  const a = appr as any
  if (a.status !== 'approved') redirect(`/approvals/${approvalId}`)

  const { data: existingPo } = await supabase
    .from('purchase_orders').select('id').eq('quotation_id', a.quotation_id).maybeSingle()
  if (existingPo) redirect(`/purchase-orders/${existingPo.id}`)

  const subtotal = Number(a.quotation?.total_amount ?? 0)
  const taxRate = DEFAULT_TAX_RATE
  const taxAmount = Math.round(subtotal * taxRate) / 100
  const total = subtotal + taxAmount
  const deliveryDays = a.quotation?.delivery_days ?? null
  const expected = deliveryDays != null
    ? new Date(Date.now() + deliveryDays * 86400000).toISOString().slice(0, 10)
    : null

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      quotation_id: a.quotation_id,
      rfq_id: a.rfq_id,
      vendor_id: a.quotation?.vendor_id,
      status: 'issued',
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: total,
      expected_delivery: expected,
      issued_by: profile.id,
    })
    .select('id, po_number')
    .single()
  if (error || !po) redirect(`/approvals/${approvalId}?error=po`)

  const items = (a.quotation?.quotation_items ?? []).map((it: any) => ({
    po_id: po.id,
    product_name: it.product_name,
    quantity: it.quantity,
    unit_price: it.unit_price,
    line_total: it.line_total,
  }))
  if (items.length) await supabase.from('po_items').insert(items)

  await logActivity({ action: 'po.created', entityType: 'purchase_order', entityId: po.id, description: `Purchase order ${po.po_number} issued` })
  const { data: vendorUsers } = await supabase.from('profiles').select('id').eq('vendor_id', a.quotation?.vendor_id ?? '')
  await notify((vendorUsers ?? []).map((u: any) => u.id), {
    title: 'Purchase order issued',
    message: `Purchase order ${po.po_number} has been issued to you.`,
    type: 'po',
    link: `/purchase-orders/${po.id}`,
  })

  revalidatePath('/purchase-orders')
  redirect(`/purchase-orders/${po.id}`)
}

export async function updatePoStatus(id: string, status: PoStatus) {
  await requireRole([...OFFICERS])
  const supabase = await createClient()
  await supabase.from('purchase_orders').update({ status }).eq('id', id)
  await logActivity({ action: `po.${status}`, entityType: 'purchase_order', entityId: id, description: `Purchase order marked ${status}` })
  revalidatePath('/purchase-orders')
  revalidatePath(`/purchase-orders/${id}`)
  redirect(`/purchase-orders/${id}`)
}
