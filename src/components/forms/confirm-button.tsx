'use client'

import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { SubmitButton } from './submit-button'

/**
 * Renders a trigger button; on click asks for confirmation in a modal, then
 * submits the provided server action. Bind args into `action` beforehand
 * (e.g. deleteVendor.bind(null, id)).
 */
export function ConfirmButton({
  action,
  title,
  message,
  confirmLabel = 'Confirm',
  trigger,
  variant = 'primary',
  size,
  className,
  triggerProps,
}: {
  action: () => void | Promise<void>
  title: string
  message?: string
  confirmLabel?: string
  trigger: React.ReactNode
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
  triggerProps?: ButtonProps
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        {...triggerProps}
      >
        {trigger}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={message}
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <form action={action}>
              <SubmitButton variant={variant === 'danger' ? 'danger' : 'primary'}>
                {confirmLabel}
              </SubmitButton>
            </form>
          </>
        }
      />
    </>
  )
}
