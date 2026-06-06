import Link from 'next/link'
import { Plus, Building2, Search, Mail, Phone } from 'lucide-react'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { STAFF_ROLES, VENDOR_CATEGORIES, VENDOR_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Rating } from '@/components/ui/rating'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Vendor } from '@/lib/db/types'

export const metadata = { title: 'Vendors — VendorBridge' }

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>
}) {
  await requireRole(STAFF_ROLES)
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase.from('vendors').select('*').order('name')
  if (sp.q) query = query.ilike('name', `%${sp.q}%`)
  if (sp.status) query = query.eq('status', sp.status)
  if (sp.category) query = query.eq('category', sp.category)
  const { data } = await query
  const vendors = (data ?? []) as Vendor[]

  return (
    <div className="space-y-6">
      <PageHeader title="Vendors" description="Register and manage your supplier records.">
        <Link href="/vendors/new" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
          <Plus className="h-4 w-4" /> Add vendor
        </Link>
      </PageHeader>

      <Card>
        <form method="GET" className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Search by name…" className="pl-9" />
          </div>
          <Select name="status" defaultValue={sp.status ?? ''} className="w-auto">
            <option value="">All statuses</option>
            {Object.entries(VENDOR_STATUS).map(([v, m]) => (
              <option key={v} value={v}>{m.label}</option>
            ))}
          </Select>
          <Select name="category" defaultValue={sp.category ?? ''} className="w-auto">
            <option value="">All categories</option>
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'md' })}>
            Filter
          </button>
          {(sp.q || sp.status || sp.category) && (
            <Link href="/vendors" className={buttonVariants({ variant: 'ghost', size: 'md' })}>
              Clear
            </Link>
          )}
        </form>

        {vendors.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No vendors found"
            description="Try adjusting filters, or register your first vendor."
            action={
              <Link href="/vendors/new" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                <Plus className="h-4 w-4" /> Add vendor
              </Link>
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Vendor</TH>
                <TH>Category</TH>
                <TH>GST</TH>
                <TH>Contact</TH>
                <TH>Rating</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {vendors.map((v) => (
                <TR key={v.id} className="cursor-pointer hover:bg-slate-50">
                  <TD>
                    <Link href={`/vendors/${v.id}`} className="flex items-center gap-3">
                      <Avatar name={v.name} />
                      <span>
                        <span className="block font-medium text-slate-900">{v.name}</span>
                        <span className="block text-xs text-slate-400">{v.city ?? '—'}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD>{v.category ?? '—'}</TD>
                  <TD className="font-mono text-xs">{v.gst_number ?? '—'}</TD>
                  <TD>
                    <span className="block text-sm text-slate-700">{v.contact_person ?? '—'}</span>
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                      {v.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{v.email}</span>}
                      {v.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{v.phone}</span>}
                    </span>
                  </TD>
                  <TD><Rating value={v.rating} /></TD>
                  <TD><StatusBadge kind="vendor" value={v.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400">{vendors.length} vendor{vendors.length === 1 ? '' : 's'}</p>
    </div>
  )
}
