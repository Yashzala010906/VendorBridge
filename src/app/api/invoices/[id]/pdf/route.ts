import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { buildInvoiceDoc } from '@/lib/pdf/invoice-pdf'
import { getCurrentProfile } from '@/lib/auth/dal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'procurement_officer' && profile.role !== 'manager')) {
    return new Response('Forbidden', { status: 403 })
  }
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, vendor:vendors(name, email, address, gst_number), invoice_items(description, quantity, unit_price, line_total)')
    .eq('id', id)
    .maybeSingle()

  // RLS already restricts visibility; a missing row means no access or no such invoice.
  if (!invoice) return new Response('Not found', { status: 404 })

  const buffer = await renderToBuffer(buildInvoiceDoc(invoice as any))
  const filename = `${(invoice as any).invoice_number ?? 'invoice'}.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
