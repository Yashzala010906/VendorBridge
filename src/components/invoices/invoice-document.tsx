import { Boxes } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'

const COMPANY = {
  name: 'VendorBridge Pvt. Ltd.',
  address: 'Level 7, Tech Park, Outer Ring Road, Bengaluru 560103',
  gstin: '29ABCDE1234F1Z5',
  email: 'procurement@vendorbridge.example',
}

interface InvoiceDoc {
  invoice_number: string | null
  status: string
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  notes: string | null
  vendor?: { name?: string | null; email?: string | null; address?: string | null; gst_number?: string | null; phone?: string | null } | null
  invoice_items?: { id?: string; description: string; quantity: number; unit_price: number; line_total: number }[]
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceDoc }) {
  const items = invoice.invoice_items ?? []
  return (
    <div className="print-sheet mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Boxes className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">{COMPANY.name}</p>
            <p className="max-w-[15rem] text-xs text-slate-500">{COMPANY.address}</p>
            <p className="text-xs text-slate-500">GSTIN: {COMPANY.gstin}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight text-slate-900">INVOICE</p>
          <p className="font-mono text-sm text-slate-500">{invoice.invoice_number}</p>
          <div className="mt-2 flex justify-end"><StatusBadge kind="invoice" value={invoice.status} /></div>
        </div>
      </div>

      {/* Parties + meta */}
      <div className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">{invoice.vendor?.name}</p>
          {invoice.vendor?.address && <p className="text-sm text-slate-500">{invoice.vendor.address}</p>}
          {invoice.vendor?.gst_number && <p className="text-xs text-slate-500">GSTIN: {invoice.vendor.gst_number}</p>}
          {invoice.vendor?.email && <p className="text-sm text-slate-500">{invoice.vendor.email}</p>}
        </div>
        <div className="sm:text-right">
          <Meta label="Issue date" value={formatDate(invoice.issue_date)} />
          <Meta label="Due date" value={formatDate(invoice.due_date)} />
        </div>
      </div>

      {/* Items */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="border-b-2 border-slate-200 py-2">Description</th>
            <th className="border-b-2 border-slate-200 py-2 text-right">Qty</th>
            <th className="border-b-2 border-slate-200 py-2 text-right">Unit price</th>
            <th className="border-b-2 border-slate-200 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id ?? i}>
              <td className="border-b border-slate-100 py-2.5 text-slate-800">{it.description}</td>
              <td className="border-b border-slate-100 py-2.5 text-right text-slate-600">{formatNumber(it.quantity)}</td>
              <td className="border-b border-slate-100 py-2.5 text-right text-slate-600">{formatCurrency(it.unit_price)}</td>
              <td className="border-b border-slate-100 py-2.5 text-right font-medium text-slate-900">{formatCurrency(it.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5">
          <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
          <Row label={`Tax (${invoice.tax_rate}%)`} value={formatCurrency(invoice.tax_amount)} />
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-sm font-semibold text-slate-900">Total due</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-8 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
          <p className="mt-1 text-sm text-slate-600">{invoice.notes}</p>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-400">
        This is a computer-generated invoice from {COMPANY.name}. {COMPANY.email}
      </p>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 sm:justify-end">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  )
}
