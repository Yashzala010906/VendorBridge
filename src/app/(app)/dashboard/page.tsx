import Link from 'next/link'
import {
  FileText, ClipboardCheck, PackageCheck, IndianRupee, ReceiptText,
  Plus, Building2, ArrowRight, Inbox,
} from 'lucide-react'
import { getCurrentProfile } from '@/lib/auth/dal'
import { isStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonVariants } from '@/components/ui/button'
import { formatCurrency, formatDate, formatRelative } from '@/lib/utils'

export const metadata = { title: 'Dashboard — VendorBridge' }

function monthStartISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function Section({ title, href, linkLabel, children }: {
  title: string; href?: string; linkLabel?: string; children: React.ReactNode
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
            {linkLabel ?? 'View all'} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </CardHeader>
      <div className="divide-y divide-slate-100">{children}</div>
    </Card>
  )
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50">
      {children}
    </Link>
  )
}

export default async function DashboardPage() {
  const profile = (await getCurrentProfile())!
  const supabase = await createClient()
  const firstName = (profile.full_name || 'there').split(' ')[0]

  if (isStaff(profile.role)) {
    const [activeRfqs, pendingApprovalsCount, openPos, vendorCount, pendingApprovals, activeRfqList, recentPos, recentInvoices, monthInvoices] =
      await Promise.all([
        supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).in('status', ['issued', 'acknowledged']),
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
        supabase.from('approvals')
          .select('id, status, created_at, quotation:quotations(id, total_amount, vendor:vendors(name)), rfq:rfqs(title, rfq_number)')
          .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
        supabase.from('rfqs').select('id, rfq_number, title, status, deadline').eq('status', 'published').order('deadline', { ascending: true }).limit(5),
        supabase.from('purchase_orders').select('id, po_number, total_amount, status, created_at, vendor:vendors(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('id, invoice_number, total_amount, status, issue_date, vendor:vendors(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('total_amount, status, issue_date').gte('issue_date', monthStartISO()),
      ])

    const spend = (monthInvoices.data ?? [])
      .filter((i: any) => i.status === 'sent' || i.status === 'paid')
      .reduce((s: number, i: any) => s + Number(i.total_amount), 0)

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Welcome back, {firstName}</h1>
            <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening across procurement.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/vendors/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Building2 className="h-4 w-4" /> Add vendor
            </Link>
            <Link href="/rfqs/new" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
              <Plus className="h-4 w-4" /> New RFQ
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active RFQs" value={activeRfqs.count ?? 0} icon={FileText} tone="blue" href="/rfqs" />
          <StatCard label="Pending Approvals" value={pendingApprovalsCount.count ?? 0} icon={ClipboardCheck} tone="amber" href="/approvals" />
          <StatCard label="Open Purchase Orders" value={openPos.count ?? 0} icon={PackageCheck} tone="purple" href="/purchase-orders" />
          <StatCard label="Spend this month" value={formatCurrency(spend)} icon={IndianRupee} tone="emerald" hint={`${vendorCount.count ?? 0} vendors registered`} href="/reports" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Pending approvals" href="/approvals" linkLabel="Review">
            {(pendingApprovals.data ?? []).length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Nothing awaiting approval" description="Quotations sent for approval will appear here." />
            ) : (
              (pendingApprovals.data as any[]).map((a) => (
                <Row key={a.id} href={`/approvals/${a.id}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{a.rfq?.title ?? 'Quotation'}</p>
                    <p className="truncate text-xs text-slate-400">{a.quotation?.vendor?.name} · {a.rfq?.rfq_number}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-900">{formatCurrency(a.quotation?.total_amount)}</span>
                </Row>
              ))
            )}
          </Section>

          <Section title="Active RFQs" href="/rfqs" linkLabel="All RFQs">
            {(activeRfqList.data ?? []).length === 0 ? (
              <EmptyState icon={FileText} title="No active RFQs" description="Published RFQs awaiting quotations show here." />
            ) : (
              (activeRfqList.data as any[]).map((r) => (
                <Row key={r.id} href={`/rfqs/${r.id}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{r.title}</p>
                    <p className="truncate text-xs text-slate-400">{r.rfq_number} · due {formatDate(r.deadline)}</p>
                  </div>
                  <StatusBadge kind="rfq" value={r.status} />
                </Row>
              ))
            )}
          </Section>

          <Section title="Recent purchase orders" href="/purchase-orders">
            {(recentPos.data ?? []).length === 0 ? (
              <EmptyState icon={PackageCheck} title="No purchase orders yet" />
            ) : (
              (recentPos.data as any[]).map((p) => (
                <Row key={p.id} href={`/purchase-orders/${p.id}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.po_number}</p>
                    <p className="truncate text-xs text-slate-400">{p.vendor?.name} · {formatRelative(p.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(p.total_amount)}</span>
                    <StatusBadge kind="po" value={p.status} />
                  </div>
                </Row>
              ))
            )}
          </Section>

          <Section title="Recent invoices" href="/invoices">
            {(recentInvoices.data ?? []).length === 0 ? (
              <EmptyState icon={ReceiptText} title="No invoices yet" />
            ) : (
              (recentInvoices.data as any[]).map((inv) => (
                <Row key={inv.id} href={`/invoices/${inv.id}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{inv.invoice_number}</p>
                    <p className="truncate text-xs text-slate-400">{inv.vendor?.name} · {formatDate(inv.issue_date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(inv.total_amount)}</span>
                    <StatusBadge kind="invoice" value={inv.status} />
                  </div>
                </Row>
              ))
            )}
          </Section>
        </div>
      </div>
    )
  }

  // ---- Vendor dashboard ----
  const vendorId = profile.vendor_id
  const [toQuote, myQuotationsCount, myPos, myInvoicesCount, awaitingList, myQuotations] = await Promise.all([
    supabase.from('rfq_vendors').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId ?? '').eq('has_responded', false),
    supabase.from('quotations').select('id', { count: 'exact', head: true }),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('id', { count: 'exact', head: true }),
    supabase.from('rfq_vendors').select('rfq:rfqs(id, rfq_number, title, status, deadline)').eq('vendor_id', vendorId ?? '').eq('has_responded', false).limit(5),
    supabase.from('quotations').select('id, quotation_number, status, total_amount, created_at, rfq:rfqs(title)').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">Respond to requests and track your orders.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="RFQs to quote" value={toQuote.count ?? 0} icon={Inbox} tone="amber" href="/rfqs" />
        <StatCard label="My quotations" value={myQuotationsCount.count ?? 0} icon={ReceiptText} tone="blue" href="/quotations" />
        <StatCard label="Purchase orders" value={myPos.count ?? 0} icon={PackageCheck} tone="purple" href="/purchase-orders" />
        <StatCard label="Invoices" value={myInvoicesCount.count ?? 0} icon={IndianRupee} tone="emerald" href="/invoices" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Awaiting your quotation" href="/rfqs">
          {(awaitingList.data ?? []).length === 0 ? (
            <EmptyState icon={Inbox} title="You're all caught up" description="New invitations to quote will appear here." />
          ) : (
            (awaitingList.data as any[]).map((row, i) => (
              <Row key={row.rfq?.id ?? i} href={`/rfqs/${row.rfq?.id}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{row.rfq?.title}</p>
                  <p className="truncate text-xs text-slate-400">{row.rfq?.rfq_number} · due {formatDate(row.rfq?.deadline)}</p>
                </div>
                <span className={buttonVariants({ variant: 'outline', size: 'sm' })}>Submit quote</span>
              </Row>
            ))
          )}
        </Section>

        <Section title="My recent quotations" href="/quotations">
          {(myQuotations.data ?? []).length === 0 ? (
            <EmptyState icon={ReceiptText} title="No quotations yet" />
          ) : (
            (myQuotations.data as any[]).map((q) => (
              <Row key={q.id} href={`/quotations/${q.id}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{q.rfq?.title ?? q.quotation_number}</p>
                  <p className="truncate text-xs text-slate-400">{q.quotation_number} · {formatRelative(q.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(q.total_amount)}</span>
                  <StatusBadge kind="quotation" value={q.status} />
                </div>
              </Row>
            ))
          )}
        </Section>
      </div>
    </div>
  )
}
