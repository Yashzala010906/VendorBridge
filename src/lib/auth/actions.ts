'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/db/types'

export interface AuthState {
  error?: string
  message?: string
}

const SIGNUP_ROLES: UserRole[] = ['procurement_officer', 'manager', 'vendor']

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Email and password are required.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get('full_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const roleInput = String(formData.get('role') ?? 'procurement_officer') as UserRole
  const companyName = String(formData.get('company_name') ?? '').trim()
  const role = SIGNUP_ROLES.includes(roleInput) ? roleInput : 'procurement_officer'

  if (!fullName) return { error: 'Please enter your name.' }
  if (!email) return { error: 'Please enter your email.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (role === 'vendor' && !companyName) return { error: 'Please enter your company name.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role, company_name: companyName || null } },
  })
  if (error) return { error: error.message }

  if (data.session) redirect('/dashboard')

  // Since we have an auto-confirm email trigger in the database,
  // we can log the user in immediately.
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (!signInError && signInData.session) {
    redirect('/dashboard')
  }

  return { message: 'Account created successfully. Please sign in.' }
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: 'Please enter your email.' }

  const h = await headers()
  const origin = h.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` })
  return { message: 'If an account exists for that email, a password reset link is on its way.' }
}
