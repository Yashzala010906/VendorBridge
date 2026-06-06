import Link from 'next/link'
import { Boxes, ShieldCheck, FileText, BarChart3 } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
            <Boxes className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">VendorBridge</span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Run procurement with confidence.
          </h2>
          <p className="mt-3 text-brand-100">
            From RFQ to invoice, keep vendors, approvals and spend in one secure, structured place.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <Point icon={ShieldCheck} title="Role-based access" desc="Admins, Officers, Managers and Vendors each see exactly what they should." />
            <Point icon={FileText} title="Structured workflows" desc="RFQs, quotations, approvals and POs that flow into each other." />
            <Point icon={BarChart3} title="Real-time tracking" desc="Activity logs and analytics across every procurement action." />
          </ul>
        </div>

        <p className="text-xs text-brand-200">© {new Date().getFullYear()} VendorBridge</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Boxes className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">VendorBridge</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}

function Point({ icon: Icon, title, desc }: { icon: typeof ShieldCheck; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-brand-100">{desc}</p>
      </div>
    </li>
  )
}
