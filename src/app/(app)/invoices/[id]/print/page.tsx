import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { InvoiceDocument } from '@/components/invoices/invoice-document'
import { PrintButton, AutoPrint } from '@/components/invoices/print-controls'

export const metadata = { title: 'Invoice — Print' }

export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ auto?: string }>
}) {
  await requireRole(['admin', 'procurement_officer', 'manager'])
  const { id } = await params
  const { auto } = await searchParams
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, vendor:vendors(name, email, address, gst_number, phone), invoice_items(id, description, quantity, unit_price, line_total)')
    .eq('id', id)
    .maybeSingle()
  if (!invoice) notFound()

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link href={`/invoices/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to invoice
        </Link>
        <PrintButton label="Print invoice" />
      </div>
      <InvoiceDocument invoice={invoice as any} />
      <AutoPrint enabled={auto === '1'} />
    </div>
  )
}
