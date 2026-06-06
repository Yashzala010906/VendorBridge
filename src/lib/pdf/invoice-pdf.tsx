import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'

const COMPANY = {
  name: 'VendorBridge Pvt. Ltd.',
  address: 'Level 7, Tech Park, Outer Ring Road, Bengaluru 560103',
  gstin: '29ABCDE1234F1Z5',
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#0f172a', fontFamily: 'Helvetica' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  brand: { fontSize: 16, fontWeight: 700, color: '#4f46e5' },
  muted: { color: '#64748b' },
  h1: { fontSize: 22, fontWeight: 700 },
  section: { marginTop: 24 },
  label: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  th: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#e2e8f0', paddingBottom: 6, marginTop: 18 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 },
  cDesc: { flex: 4 },
  cNum: { flex: 1.4, textAlign: 'right' },
  totalsBox: { marginTop: 16, marginLeft: 'auto', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  bold: { fontWeight: 700 },
})

interface InvoicePdf {
  invoice_number: string | null
  status: string
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  notes: string | null
  vendor?: { name?: string | null; address?: string | null; gst_number?: string | null; email?: string | null } | null
  invoice_items?: { description: string; quantity: number; unit_price: number; line_total: number }[]
}

export function buildInvoiceDoc(inv: InvoicePdf) {
  const items = inv.invoice_items ?? []
  return (
    <Document title={`Invoice ${inv.invoice_number ?? ''}`}>
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View>
            <Text style={s.brand}>{COMPANY.name}</Text>
            <Text style={[s.muted, { maxWidth: 220, marginTop: 2 }]}>{COMPANY.address}</Text>
            <Text style={s.muted}>GSTIN: {COMPANY.gstin}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.h1}>INVOICE</Text>
            <Text style={s.muted}>{inv.invoice_number}</Text>
            <Text style={[s.muted, { marginTop: 2, textTransform: 'uppercase' }]}>{inv.status}</Text>
          </View>
        </View>

        <View style={[s.row, s.section]}>
          <View>
            <Text style={s.label}>Bill To</Text>
            <Text style={[s.bold, { marginTop: 4 }]}>{inv.vendor?.name ?? ''}</Text>
            {inv.vendor?.address ? <Text style={s.muted}>{inv.vendor.address}</Text> : null}
            {inv.vendor?.gst_number ? <Text style={s.muted}>GSTIN: {inv.vendor.gst_number}</Text> : null}
            {inv.vendor?.email ? <Text style={s.muted}>{inv.vendor.email}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.muted}>Issue date: {formatDate(inv.issue_date)}</Text>
            <Text style={s.muted}>Due date: {formatDate(inv.due_date)}</Text>
          </View>
        </View>

        <View style={s.th}>
          <Text style={[s.cDesc, s.label]}>Description</Text>
          <Text style={[s.cNum, s.label]}>Qty</Text>
          <Text style={[s.cNum, s.label]}>Unit price</Text>
          <Text style={[s.cNum, s.label]}>Amount</Text>
        </View>
        {items.map((it, i) => (
          <View style={s.tr} key={i}>
            <Text style={s.cDesc}>{it.description}</Text>
            <Text style={s.cNum}>{formatNumber(it.quantity)}</Text>
            <Text style={s.cNum}>{formatCurrency(it.unit_price)}</Text>
            <Text style={[s.cNum, s.bold]}>{formatCurrency(it.line_total)}</Text>
          </View>
        ))}

        <View style={s.totalsBox}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Subtotal</Text>
            <Text>{formatCurrency(inv.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.muted}>Tax ({inv.tax_rate}%)</Text>
            <Text>{formatCurrency(inv.tax_amount)}</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.bold}>Total due</Text>
            <Text style={s.bold}>{formatCurrency(inv.total_amount)}</Text>
          </View>
        </View>

        {inv.notes ? (
          <View style={s.section}>
            <Text style={s.label}>Notes</Text>
            <Text style={[s.muted, { marginTop: 4 }]}>{inv.notes}</Text>
          </View>
        ) : null}

        <Text style={[s.muted, { marginTop: 40, textAlign: 'center', fontSize: 8 }]}>
          Computer-generated invoice from {COMPANY.name}.
        </Text>
      </Page>
    </Document>
  )
}
