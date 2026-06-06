'use client'

import { useActionState } from 'react'
import { requestPasswordReset, type AuthState } from '@/lib/auth/actions'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { SubmitButton } from '@/components/forms/submit-button'

export function ForgotForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, {})

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.message && <Alert tone="success">{state.message}</Alert>}

      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
      </Field>

      <SubmitButton className="w-full" size="lg">
        Send reset link
      </SubmitButton>
    </form>
  )
}
