'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { logActivity } from '@/lib/activity'
import type { VendorStatus } from '@/lib/db/types'

export interface VendorFormState {
  error?: string
}

const VENDOR_MANAGERS = ['admin', 'procurement_officer'] as const

function parseVendor(fd: FormData) {
  const rating = Number(fd.get('rating') ?? 0)
  return {
    name: String(fd.get('name') ?? '').trim(),
    category: String(fd.get('category') ?? '').trim() || null,
    gst_number: String(fd.get('gst_number') ?? '').trim() || null,
    email: String(fd.get('email') ?? '').trim() || null,
    phone: String(fd.get('phone') ?? '').trim() || null,
    contact_person: String(fd.get('contact_person') ?? '').trim() || null,
    city: String(fd.get('city') ?? '').trim() || null,
    address: String(fd.get('address') ?? '').trim() || null,
    status: (String(fd.get('status') ?? 'active') as VendorStatus),
    rating: isNaN(rating) ? 0 : Math.max(0, Math.min(5, rating)),
    notes: String(fd.get('notes') ?? '').trim() || null,
  }
}

export async function createVendor(_prev: VendorFormState, formData: FormData): Promise<VendorFormState> {
  const profile = await requireRole([...VENDOR_MANAGERS])
  const v = parseVendor(formData)
  if (!v.name) return { error: 'Vendor name is required.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vendors')
    .insert({ ...v, created_by: profile.id })
    .select('id')
    .single()
  if (error) return { error: error.message }

  await logActivity({
    action: 'vendor.created',
    entityType: 'vendor',
    entityId: data.id,
    description: `Vendor "${v.name}" registered`,
  })
  revalidatePath('/vendors')
  redirect(`/vendors/${data.id}`)
}

export async function updateVendor(
  id: string,
  _prev: VendorFormState,
  formData: FormData
): Promise<VendorFormState> {
  await requireRole([...VENDOR_MANAGERS])
  const v = parseVendor(formData)
  if (!v.name) return { error: 'Vendor name is required.' }

  const supabase = await createClient()
  const { error } = await supabase.from('vendors').update(v).eq('id', id)
  if (error) return { error: error.message }

  await logActivity({
    action: 'vendor.updated',
    entityType: 'vendor',
    entityId: id,
    description: `Vendor "${v.name}" updated`,
  })
  revalidatePath('/vendors')
  revalidatePath(`/vendors/${id}`)
  redirect(`/vendors/${id}`)
}

export async function deleteVendor(id: string) {
  await requireRole(['admin'])
  const supabase = await createClient()
  const { error } = await supabase.from('vendors').delete().eq('id', id)
  if (error) {
    // Most likely blocked by a foreign-key (vendor has POs/invoices).
    redirect(`/vendors/${id}?error=delete`)
  }
  await logActivity({ action: 'vendor.deleted', entityType: 'vendor', entityId: id, description: 'Vendor deleted' })
  revalidatePath('/vendors')
  redirect('/vendors')
}
