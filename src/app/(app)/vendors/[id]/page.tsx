import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Trash2, Mail, Phone, MapPin, Hash } from 'lucide-react'
import { requireRole, getCurrentProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { STAFF_ROLES } from '@/lib/constants'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Rating } from '@/components/ui/rating'
import { Avatar } from '@/components/ui/avatar'
import { Alert } from '@/components/ui/alert'
import { ConfirmButton } from '@/components/forms/confirm-button'
import { VendorForm } from '@/components/vendors/vendor-form'
import { updateVendor, deleteVendor } from '@/lib/actions/vendors'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Vendor } from '@/lib/db/types'

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  await requireRole(STAFF_ROLES)
  const { id } = await params
  const { error } = await searchParams
  const profile = (await getCurrentProfile())!
  const supabase = await createClient()

  const { data } = await supabase.from('vendors').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const vendor = data as Vendor

  const { data: quotations } = await supabase
    .from('quotations')
    .select('id, quotation_number, status, total_amount, created_at, rfq:rfqs(title)')
    .eq('vendor_id', id)
    .order('created_at', { ascending: false })
    .limit(6)

  const canManage = profile.role === 'admin'
  const canDelete = profile.role === 'admin'

  return (
    <div className="space-y-6">
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Vendors
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={vendor.name} className="h-12 w-12 text-sm" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{vendor.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge kind="vendor" value={vendor.status} />
              {vendor.category && <span className="text-sm text-slate-400">{vendor.category}</span>}
              <Rating value={vendor.rating} />
            </div>
          </div>
        </div>
        {canDelete && (
          <ConfirmButton
            action={deleteVendor.bind(null, vendor.id)}
            title="Delete vendor?"
            message="This permanently removes the vendor. It will fail if the vendor has linked purchase orders or invoices."
            confirmLabel="Delete vendor"
            variant="danger"
            size="sm"
            trigger={<><Trash2 className="h-4 w-4" /> Delete</>}
          />
        )}
      </div>

      {error === 'delete' && (
        <Alert tone="error">Couldn&apos;t delete this vendor — it still has linked purchase orders or invoices.</Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              {canManage ? 'Edit vendor details' : 'Vendor details'}
            </h2>
            {canManage ? (
              <VendorForm action={updateVendor.bind(null, vendor.id)} vendor={vendor} submitLabel="Save changes" />
            ) : (
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Detail icon={Hash} label="GST number" value={vendor.gst_number} mono />
                <Detail icon={Mail} label="Email" value={vendor.email} />
                <Detail icon={Phone} label="Phone" value={vendor.phone} />
                <Detail label="Contact person" value={vendor.contact_person} />
                <Detail icon={MapPin} label="City" value={vendor.city} />
                <Detail label="Address" value={vendor.address} />
                {vendor.notes && <Detail label="Notes" value={vendor.notes} className="sm:col-span-2" />}
              </dl>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Recent quotations</CardTitle></CardHeader>
            <CardContent className="p-0">
              {(quotations ?? []).length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-slate-400">No quotations yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(quotations as any[]).map((q) => (
                    <li key={q.id}>
                      <Link href={`/quotations/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{q.rfq?.title ?? q.quotation_number}</p>
                          <p className="text-xs text-slate-400">{formatDate(q.created_at)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{formatCurrency(q.total_amount)}</span>
                          <StatusBadge kind="quotation" value={q.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Detail({
  icon: Icon, label, value, mono, className,
}: {
  icon?: typeof Mail; label: string; value: string | null; mono?: boolean; className?: string
}) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </dt>
      <dd className={`mt-1 text-sm text-slate-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  )
}
