import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Printer, Download, IndianRupee, PackageCheck } from 'lucide-react'
import { getCurrentProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/forms/submit-button'
import { InvoiceDocument } from '@/components/invoices/invoice-document'
import { SendInvoiceButton } from '@/components/invoices/send-invoice-button'
import { sendInvoiceEmail, updateInvoiceStatus } from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/utils'

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const { id } = await params
  const { sent, error } = await searchParams
  const profile = (await getCurrentProfile())!
  const canManage = profile.role === 'admin' || profile.role === 'procurement_officer'
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, vendor:vendors(name, email, address, gst_number, phone), invoice_items(id, description, quantity, unit_price, line_total), po:purchase_orders(id, po_number)')
    .eq('id', id)
    .maybeSingle()
  if (!invoice) notFound()
  const inv = invoice as any

  return (
    <div className="space-y-5">
      {/* Toolbar (hidden in print) */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Invoices
        </Link>
        <div className="flex flex-wrap gap-2">
          {inv.po && (
            <Link href={`/purchase-orders/${inv.po.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              <PackageCheck className="h-4 w-4" /> {inv.po.po_number}
            </Link>
          )}
          <Link href={`/invoices/${id}/print?auto=1`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <Printer className="h-4 w-4" /> Print
          </Link>
          <a href={`/api/invoices/${id}/pdf`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <Download className="h-4 w-4" /> Download PDF
          </a>
          {canManage && inv.status !== 'paid' && inv.status !== 'cancelled' && (
            <form action={updateInvoiceStatus.bind(null, id, 'paid')}>
              <SubmitButton variant="success" size="sm"><IndianRupee className="h-4 w-4" /> Mark paid</SubmitButton>
            </form>
          )}
          {canManage && (
            <SendInvoiceButton
              action={sendInvoiceEmail.bind(null, id)}
              defaultTo={inv.vendor?.email ?? ''}
              invoiceNumber={inv.invoice_number}
              total={formatCurrency(inv.total_amount)}
            />
          )}
        </div>
      </div>

      {sent && (
        <Alert tone="success" className="no-print">
          Invoice emailed to {inv.sent_to ?? 'the vendor'}{sent === 'mock' ? ' (mock provider — no real email sent).' : '.'}
        </Alert>
      )}
      {error === 'noemail' && (
        <Alert tone="error" className="no-print">This vendor has no email on file. Add one or enter a recipient.</Alert>
      )}

      <InvoiceDocument invoice={inv} />
    </div>
  )
}
