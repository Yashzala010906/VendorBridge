import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ForgotForm } from '@/components/auth/forgot-form'

export const metadata = { title: 'Reset password — VendorBridge' }

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <div className="mt-6">
        <ForgotForm />
      </div>

      <Link
        href="/login"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </div>
  )
}
