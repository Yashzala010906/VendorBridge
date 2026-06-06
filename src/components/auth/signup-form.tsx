'use client'

import { useActionState, useState } from 'react'
import { signup, type AuthState } from '@/lib/auth/actions'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { SubmitButton } from '@/components/forms/submit-button'
import type { UserRole } from '@/lib/db/types'

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signup, {})
  const [role, setRole] = useState<UserRole>('procurement_officer')

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.message && <Alert tone="success">{state.message}</Alert>}

      <Field label="Full name" htmlFor="full_name">
        <Input id="full_name" name="full_name" required autoComplete="name" placeholder="Asha Verma" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" required autoComplete="new-password" placeholder="••••••••" />
      </Field>
      <Field label="I am a…" htmlFor="role">
        <Select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="procurement_officer">Procurement Officer</option>
          <option value="manager">Manager / Approver</option>
          <option value="vendor">Vendor</option>
        </Select>
      </Field>

      {role === 'vendor' && (
        <Field label="Company name" htmlFor="company_name">
          <Input id="company_name" name="company_name" placeholder="Acme Industrial Supplies" />
        </Field>
      )}

      <SubmitButton className="w-full" size="lg">
        Create account
      </SubmitButton>
      <p className="text-center text-xs text-slate-400">
        The first account created becomes the workspace admin.
      </p>
    </form>
  )
}
