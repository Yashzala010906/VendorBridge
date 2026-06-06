'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { logActivity, notify } from '@/lib/activity'
import { sendEmail } from '@/lib/email'
import { buildInvoiceEmail } from '@/lib/invoice-email'
import { formatCurrency } from '@/lib/utils'
import type { InvoiceStatus } from '@/lib/db/types'

const OFFICERS = ['admin', 'procurement_officer'] as const

/** Generate an invoice from a Purchase Order (copies totals + line items). */
export async function generateInvoiceFromPo(poId: string) {
  const profile = await requireRole([...OFFICERS])
  const supabase = await createClient()

  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id, po_number, vendor_id, subtotal, tax_rate, tax_amount, total_amount, po_items(product_name, quantity, unit_price, line_total)')
    .eq('id', poId)
    .maybeSingle()
  if (!po) redirect('/purchase-orders')
  const p = po as any

  const { data: existing } = await supabase.from('invoices').select('id').eq('po_id', poId).maybeSingle()
  if (existing) redirect(`/invoices/${existing.id}`)

  const { data: inv, error } = await supabase
    .from('invoices')
    .insert({
      po_id: poId,
      vendor_id: p.vendor_id,
      status: 'draft',
      subtotal: p.subtotal,
      tax_rate: p.tax_rate,
      tax_amount: p.tax_amount,
      total_amount: p.total_amount,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      created_by: profile.id,
    })
    .select('id, invoice_number')
    .single()
  if (error || !inv) redirect(`/purchase-orders/${poId}?error=invoice`)

  const items = (p.po_items ?? []).map((it: any) => ({
    invoice_id: inv.id,
    description: it.product_name,
    quantity: it.quantity,
    unit_price: it.unit_price,
    line_total: it.line_total,
  }))
  if (items.length) await supabase.from('invoice_items').insert(items)

  await logActivity({ action: 'invoice.created', entityType: 'invoice', entityId: inv.id, description: `Invoice ${inv.invoice_number} generated from ${p.po_number}` })
  revalidatePath('/invoices')
  redirect(`/invoices/${inv.id}`)
}

/** "Send" the invoice by email (mock provider unless RESEND_API_KEY is set). */
export async function sendInvoiceEmail(invoiceId: string, formData: FormData) {
  await requireRole([...OFFICERS])
  const supabase = await createClient()

  const { data: inv } = await supabase
    .from('invoices')
    .select('*, vendor:vendors(name, email), invoice_items(description, quantity, unit_price, line_total)')
    .eq('id', invoiceId)
    .maybeSingle()
  if (!inv) redirect('/invoices')
  const i = inv as any

  const to = (String(formData.get('to') ?? '').trim() || i.vendor?.email || '').trim()
  if (!to) redirect(`/invoices/${invoiceId}?error=noemail`)

  const { subject, html, text } = buildInvoiceEmail(i)
  const result = await sendEmail({ to, subject, html, text })

  await supabase
    .from('invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString(), sent_to: to })
    .eq('id', invoiceId)

  await logActivity({
    action: 'invoice.sent',
    entityType: 'invoice',
    entityId: invoiceId,
    description: `Invoice ${i.invoice_number} emailed to ${to} (${formatCurrency(i.total_amount)})`,
  })
  const { data: vendorUsers } = await supabase.from('profiles').select('id').eq('vendor_id', i.vendor_id)
  await notify((vendorUsers ?? []).map((u: any) => u.id), {
    title: 'Invoice received',
    message: `Invoice ${i.invoice_number} (${formatCurrency(i.total_amount)}) is now available.`,
    type: 'invoice',
    link: `/invoices/${invoiceId}`,
  })

  revalidatePath(`/invoices/${invoiceId}`)
  redirect(`/invoices/${invoiceId}?sent=${result.provider}`)
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  await requireRole([...OFFICERS])
  const supabase = await createClient()
  const patch: Record<string, unknown> = { status }
  if (status === 'paid') patch.paid_at = new Date().toISOString()
  await supabase.from('invoices').update(patch).eq('id', id)
  await logActivity({ action: `invoice.${status}`, entityType: 'invoice', entityId: id, description: `Invoice marked ${status}` })
  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  redirect(`/invoices/${id}`)
}
