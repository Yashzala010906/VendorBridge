'use client'

import { useActionState, useMemo, useState } from 'react'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { Alert } from '@/components/ui/alert'
import { SubmitButton } from '@/components/forms/submit-button'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { QuotationFormState } from '@/lib/actions/quotations'

type Item = { id: string; product_name: string; quantity: number; unit: string }

export function QuotationForm({
  rfqItems,
  initial,
  action,
  submitLabel = 'Submit quotation',
}: {
  rfqItems: Item[]
  initial?: { delivery_days: number | null; notes: string | null; prices: Record<string, number> }
  action: (prev: QuotationFormState, fd: FormData) => Promise<QuotationFormState>
  submitLabel?: string
}) {
  const [state, formAction] = useActionState<QuotationFormState, FormData>(action, {})
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    rfqItems.forEach((it) => {
      const p = initial?.prices?.[it.id]
      init[it.id] = p != null && p > 0 ? String(p) : ''
    })
    return init
  })

  const total = useMemo(
    () => rfqItems.reduce((s, it) => s + it.quantity * (Number(prices[it.id]) || 0), 0),
    [prices, rfqItems]
  )

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Card>
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Product / service</TH>
              <TH className="text-right">Quantity</TH>
              <TH className="text-right">Unit price (₹)</TH>
              <TH className="text-right">Line total</TH>
            </TR>
          </THead>
          <TBody>
            {rfqItems.map((it) => (
              <TR key={it.id}>
                <TD>
                  <span className="font-medium text-slate-900">{it.product_name}</span>
                  <input type="hidden" name="qi_id" value={it.id} />
                  <input type="hidden" name="qi_name" value={it.product_name} />
                  <input type="hidden" name="qi_qty" value={it.quantity} />
                </TD>
                <TD className="text-right whitespace-nowrap">{formatNumber(it.quantity)} {it.unit}</TD>
                <TD className="text-right">
                  <Input
                    name="qi_price"
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={prices[it.id]}
                    onChange={(e) => setPrices((p) => ({ ...p, [it.id]: e.target.value }))}
                    placeholder="0"
                    className="ml-auto h-9 w-32 text-right"
                  />
                </TD>
                <TD className="text-right font-medium text-slate-900">
                  {formatCurrency(it.quantity * (Number(prices[it.id]) || 0))}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-3">
          <span className="text-sm text-slate-500">Quotation total</span>
          <span className="text-xl font-semibold tracking-tight text-slate-900">{formatCurrency(total)}</span>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Terms</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Delivery time (days)" htmlFor="delivery_days">
            <Input id="delivery_days" name="delivery_days" type="number" min={0} defaultValue={initial?.delivery_days ?? ''} placeholder="e.g. 7" />
          </Field>
          <Field label="Notes / comments" htmlFor="notes" className="sm:col-span-2">
            <Textarea id="notes" name="notes" rows={3} defaultValue={initial?.notes ?? ''} placeholder="Warranty, payment terms, inclusions…" />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton size="lg">{submitLabel}</SubmitButton>
      </div>
    </form>
  )
}
