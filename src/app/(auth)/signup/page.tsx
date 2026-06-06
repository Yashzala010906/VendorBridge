import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = { title: 'Create account — VendorBridge' }

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-500">Get started with VendorBridge in seconds.</p>

      <div className="mt-6">
        <SignupForm />
      </div>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
