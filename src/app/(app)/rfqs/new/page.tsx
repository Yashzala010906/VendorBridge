import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { RfqForm } from '@/components/rfqs/rfq-form'
import { createRfq } from '@/lib/actions/rfqs'

export const metadata = { title: 'New RFQ — VendorBridge' }

export default async function NewRfqPage() {
  await requireRole(['admin', 'procurement_officer'])
  const supabase = await createClient()
  const { data } = await supabase
    .from('vendors')
    .select('id, name, category, rating, status')
    .in('status', ['active', 'pending'])
    .order('name')

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/rfqs" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> RFQs
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Create RFQ</h1>
        <p className="mt-1 text-sm text-slate-500">Define what you need and invite vendors to quote.</p>
      </div>
      <RfqForm vendors={(data ?? []) as any[]} action={createRfq} />
    </div>
  )
}
