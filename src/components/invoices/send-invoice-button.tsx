'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SubmitButton } from '@/components/forms/submit-button'

export function SendInvoiceButton({
  action,
  defaultTo,
  invoiceNumber,
  total,
}: {
  action: (fd: FormData) => void | Promise<void>
  defaultTo: string
  invoiceNumber: string
  total: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" /> Send by email
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Send invoice by email"
        description={`${invoiceNumber} · ${total}`}
      >
        <form action={action} className="space-y-4">
          <Field label="Recipient email" htmlFor="to">
            <Input id="to" name="to" type="email" defaultValue={defaultTo} required placeholder="vendor@example.com" />
          </Field>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            A formatted tax invoice will be emailed. Uses a mock sender unless an email provider is configured.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton><Send className="h-4 w-4" /> Send invoice</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  )
}
