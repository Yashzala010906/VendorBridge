import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'Sign in — VendorBridge' }

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500">Sign in to your VendorBridge workspace.</p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
          Forgot password?
        </Link>
        <span className="text-slate-500">
          New here?{' '}
          <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Create account
          </Link>
        </span>
      </div>
    </div>
  )
}
