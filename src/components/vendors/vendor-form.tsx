'use client'

import { useActionState } from 'react'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { SubmitButton } from '@/components/forms/submit-button'
import { VENDOR_CATEGORIES, VENDOR_STATUS } from '@/lib/constants'
import type { Vendor } from '@/lib/db/types'
import type { VendorFormState } from '@/lib/actions/vendors'

export function VendorForm({
  action,
  vendor,
  submitLabel = 'Save vendor',
}: {
  action: (prev: VendorFormState, fd: FormData) => Promise<VendorFormState>
  vendor?: Vendor
  submitLabel?: string
}) {
  const [state, formAction] = useActionState<VendorFormState, FormData>(action, {})

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vendor name" htmlFor="name" required className="sm:col-span-2">
          <Input id="name" name="name" required defaultValue={vendor?.name} placeholder="Acme Industrial Supplies" />
        </Field>

        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue={vendor?.category ?? ''}>
            <option value="">Select category…</option>
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={vendor?.status ?? 'active'}>
            {Object.entries(VENDOR_STATUS).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="GST number" htmlFor="gst_number">
          <Input id="gst_number" name="gst_number" defaultValue={vendor?.gst_number ?? ''} placeholder="27AABCU9603R1ZM" />
        </Field>

        <Field label="Rating (0–5)" htmlFor="rating">
          <Input id="rating" name="rating" type="number" min={0} max={5} step={0.1} defaultValue={vendor?.rating ?? 0} />
        </Field>

        <Field label="Contact person" htmlFor="contact_person">
          <Input id="contact_person" name="contact_person" defaultValue={vendor?.contact_person ?? ''} placeholder="Rahul Mehta" />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={vendor?.email ?? ''} placeholder="sales@vendor.com" />
        </Field>

        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={vendor?.phone ?? ''} placeholder="+91 98200 11111" />
        </Field>

        <Field label="City" htmlFor="city">
          <Input id="city" name="city" defaultValue={vendor?.city ?? ''} placeholder="Mumbai" />
        </Field>

        <Field label="Address" htmlFor="address" className="sm:col-span-2">
          <Textarea id="address" name="address" defaultValue={vendor?.address ?? ''} rows={2} placeholder="Street, area, state, PIN" />
        </Field>

        <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
          <Textarea id="notes" name="notes" defaultValue={vendor?.notes ?? ''} rows={2} placeholder="Internal notes about this vendor" />
        </Field>
      </div>

      <div className="flex justify-end">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  )
}
