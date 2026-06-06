import Link from 'next/link'
import {
  Boxes, FileText, ReceiptText, ClipboardCheck, PackageCheck,
  Receipt, ArrowRight, ShieldCheck, BarChart3,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

const STEPS = [
  { icon: FileText, title: 'Create RFQ', desc: 'Officers raise requests for quotation with line items and deadlines.' },
  { icon: ReceiptText, title: 'Collect Quotations', desc: 'Invited vendors submit competitive pricing and delivery terms.' },
  { icon: ClipboardCheck, title: 'Compare & Approve', desc: 'Side-by-side comparison feeds a structured approval workflow.' },
  { icon: PackageCheck, title: 'Issue PO', desc: 'Approved quotations convert into official purchase orders.' },
  { icon: Receipt, title: 'Invoice & Track', desc: 'Generate, print, email invoices and track every activity.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Boxes className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">VendorBridge</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
            <ShieldCheck className="h-3.5 w-3.5" /> Role-based procurement, end to end
          </span>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Procurement &amp; vendor management, <span className="text-brand-600">simplified</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-slate-600">
            VendorBridge centralizes vendors, RFQs, quotations, approvals, purchase orders and
            invoices into one clean ERP — with structured workflows and real-time tracking.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Sign in
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            The first account created becomes the workspace admin.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Step {i + 1}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-16 grid gap-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-8 sm:grid-cols-3">
          <Feature icon={ShieldCheck} title="Secure by design" desc="Row-level security and role-based access for Admins, Officers, Managers and Vendors." />
          <Feature icon={ReceiptText} title="Smart comparison" desc="Lowest-price highlighting, delivery and rating indicators to pick the right vendor." />
          <Feature icon={BarChart3} title="Insightful reporting" desc="Spending summaries, vendor performance and monthly procurement trends." />
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        VendorBridge — Procurement &amp; Vendor Management ERP
      </footer>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: typeof ShieldCheck; title: string; desc: string }) {
  return (
    <div>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  )
}
