import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { SpendTrendChart, StatusPieChart, TopVendorsChart } from '@/components/reports/charts'
import { ExportButton } from '@/components/reports/export-button'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, ShoppingCart, FileText, Building2 } from 'lucide-react'

export const metadata = { title: 'Reports & Analytics — VendorBridge' }

export default async function ReportsPage() {
  await requireRole(['admin'])
  const supabase = await createClient()

  // Fetch all core data in parallel
  const [
    { data: invoices },
    { data: pos },
    { data: rfqs },
    { data: quotations },
    { data: vendors },
  ] = await Promise.all([
    supabase.from('invoices').select('id, total_amount, status, issue_date, vendor_id'),
    supabase.from('purchase_orders').select('id, total_amount, status, vendor_id, created_at'),
    supabase.from('rfqs').select('id, status'),
    supabase.from('quotations').select('id, status, total_amount'),
    supabase.from('vendors').select('id, name, status'),
  ])

  const invoiceList = invoices ?? []
  const poList = pos ?? []
  const rfqList = rfqs ?? []
  const quotationList = quotations ?? []
  const vendorList = vendors ?? []

  // Summary stats
  const totalSpend = invoiceList.reduce((s, i) => s + Number(i.total_amount ?? 0), 0)
  const totalPOs = poList.length
  const activeRFQs = rfqList.filter((r) => r.status === 'published').length
  const activeVendors = vendorList.filter((v) => v.status === 'active').length

  // Monthly spending trend (last 6 months)
  const months: { month: string; amount: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
    const y = d.getFullYear()
    const m = d.getMonth()
    const amount = invoiceList
      .filter((inv) => {
        const dd = new Date(inv.issue_date)
        return dd.getFullYear() === y && dd.getMonth() === m
      })
      .reduce((s, inv) => s + Number(inv.total_amount ?? 0), 0)
    months.push({ month: label, amount })
  }

  // PO status distribution
  const poStatusCounts = {
    issued: poList.filter((p) => p.status === 'issued').length,
    acknowledged: poList.filter((p) => p.status === 'acknowledged').length,
    fulfilled: poList.filter((p) => p.status === 'fulfilled').length,
    cancelled: poList.filter((p) => p.status === 'cancelled').length,
  }
  const poStatusData = [
    { name: 'Issued', value: poStatusCounts.issued, color: '#3b82f6' },
    { name: 'Acknowledged', value: poStatusCounts.acknowledged, color: '#6366f1' },
    { name: 'Fulfilled', value: poStatusCounts.fulfilled, color: '#22c55e' },
    { name: 'Cancelled', value: poStatusCounts.cancelled, color: '#ef4444' },
  ]

  // Top vendors by spend
  const vendorSpend: Record<string, number> = {}
  for (const po of poList) {
    vendorSpend[po.vendor_id] = (vendorSpend[po.vendor_id] ?? 0) + Number(po.total_amount ?? 0)
  }
  const topVendors = Object.entries(vendorSpend)
    .map(([vid, amount]) => ({
      name: vendorList.find((v) => v.id === vid)?.name ?? 'Unknown',
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  // Exportable rows
  const exportRows = invoiceList.map((inv) => ({
    Invoice: inv.id,
    Status: inv.status,
    Amount: Number(inv.total_amount ?? 0),
    'Issue Date': inv.issue_date,
    Vendor: vendorList.find((v) => v.id === inv.vendor_id)?.name ?? inv.vendor_id,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Reports & Analytics" description="Procurement insights and spending trends." />
        <ExportButton rows={exportRows} filename="vendorbridge-report.csv" />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Spend"
          value={formatCurrency(totalSpend)}
          icon={DollarSign}
          hint="All invoices"
        />
        <StatCard
          label="Purchase Orders"
          value={totalPOs}
          icon={ShoppingCart}
          hint={`${poStatusCounts.fulfilled} fulfilled`}
        />
        <StatCard
          label="Active RFQs"
          value={activeRFQs}
          icon={FileText}
          hint={`${rfqList.length} total`}
        />
        <StatCard
          label="Active Vendors"
          value={activeVendors}
          icon={Building2}
          hint={`${vendorList.length} registered`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-500" /> Monthly Spending Trend</CardTitle></CardHeader>
          <CardContent>
            <SpendTrendChart data={months} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>PO Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <StatusPieChart data={poStatusData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Vendors by Spend</CardTitle></CardHeader>
          <CardContent>
            <TopVendorsChart data={topVendors} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quotation Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Total Quotations', value: quotationList.length, color: 'bg-slate-200' },
                { label: 'Submitted', value: quotationList.filter((q) => q.status === 'submitted').length, color: 'bg-blue-500' },
                { label: 'Under Review', value: quotationList.filter((q) => q.status === 'under_review').length, color: 'bg-amber-500' },
                { label: 'Shortlisted', value: quotationList.filter((q) => q.status === 'shortlisted').length, color: 'bg-purple-500' },
                { label: 'Accepted', value: quotationList.filter((q) => q.status === 'accepted').length, color: 'bg-emerald-500' },
                { label: 'Rejected', value: quotationList.filter((q) => q.status === 'rejected').length, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
