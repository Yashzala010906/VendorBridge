import 'server-only'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceForEmail {
  invoice_number: string | null
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  notes: string | null
  vendor?: { name?: string | null } | null
  invoice_items?: { description: string; quantity: number; unit_price: number; line_total: number }[]
}

export function buildInvoiceEmail(inv: InvoiceForEmail) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'VendorBridge'
  const rows = (inv.invoice_items ?? [])
    .map(
      (it) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eef0f4">${escapeHtml(it.description)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eef0f4;text-align:right">${it.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eef0f4;text-align:right">${formatCurrency(it.unit_price)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eef0f4;text-align:right">${formatCurrency(it.line_total)}</td>
      </tr>`
    )
    .join('')

  const subject = `Invoice ${inv.invoice_number} from ${appName} — ${formatCurrency(inv.total_amount)}`

  const html = `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
      <div style="background:#4f46e5;color:#fff;padding:20px 24px">
        <div style="font-size:18px;font-weight:700">${appName}</div>
        <div style="opacity:.85;font-size:13px">Tax Invoice</div>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 4px">Dear ${escapeHtml(inv.vendor?.name ?? 'Vendor')},</p>
        <p style="margin:0 0 16px;color:#475569;font-size:14px">Please find your invoice details below.</p>
        <table style="width:100%;font-size:13px;color:#475569;margin-bottom:16px">
          <tr><td>Invoice #</td><td style="text-align:right;font-weight:600;color:#0f172a">${inv.invoice_number}</td></tr>
          <tr><td>Issue date</td><td style="text-align:right">${formatDate(inv.issue_date)}</td></tr>
          <tr><td>Due date</td><td style="text-align:right">${formatDate(inv.due_date)}</td></tr>
        </table>
        <table style="width:100%;font-size:13px;border-collapse:collapse">
          <thead><tr style="color:#94a3b8;text-align:left">
            <th style="padding:8px 0;border-bottom:2px solid #e5e7eb">Description</th>
            <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;text-align:right">Qty</th>
            <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;text-align:right">Unit</th>
            <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;text-align:right">Amount</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <table style="width:100%;font-size:13px;margin-top:16px">
          <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(inv.subtotal)}</td></tr>
          <tr><td>Tax (${inv.tax_rate}%)</td><td style="text-align:right">${formatCurrency(inv.tax_amount)}</td></tr>
          <tr><td style="padding-top:8px;font-weight:700;font-size:15px;color:#0f172a">Total due</td>
              <td style="padding-top:8px;text-align:right;font-weight:700;font-size:15px;color:#0f172a">${formatCurrency(inv.total_amount)}</td></tr>
        </table>
        ${inv.notes ? `<p style="margin-top:16px;color:#64748b;font-size:13px">${escapeHtml(inv.notes)}</p>` : ''}
      </div>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">Sent via ${appName} — Procurement &amp; Vendor Management</p>
  </div></body></html>`

  const text = `Invoice ${inv.invoice_number}\nTotal due: ${formatCurrency(inv.total_amount)}\nDue date: ${formatDate(inv.due_date)}`

  return { subject, html, text }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
