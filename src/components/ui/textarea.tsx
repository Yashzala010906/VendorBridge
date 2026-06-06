import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { controlClass } from './input'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(controlClass, 'h-auto min-h-20 resize-y py-2 leading-relaxed', className)}
        {...props}
      />
    )
  }
)
