import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/dal'
import { Card } from '@/components/ui/card'
import { VendorForm } from '@/components/vendors/vendor-form'
import { createVendor } from '@/lib/actions/vendors'

export const metadata = { title: 'New vendor — VendorBridge' }

export default async function NewVendorPage() {
  await requireRole(['admin'])

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Vendors
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Register vendor</h1>
        <p className="mt-1 text-sm text-slate-500">Add a new supplier to your procurement network.</p>
      </div>
      <Card className="p-6">
        <VendorForm action={createVendor} submitLabel="Register vendor" />
      </Card>
    </div>
  )
}
