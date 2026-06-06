'use client'

import { useActionState, useState } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Rating } from '@/components/ui/rating'
import { StatusBadge } from '@/components/ui/status-badge'
import { SubmitButton } from '@/components/forms/submit-button'
import { VENDOR_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { RfqFormState } from '@/lib/actions/rfqs'

type VendorOption = { id: string; name: string; category: string | null; rating: number; status: string }
let rowSeq = 0

export function RfqForm({
  vendors,
  action,
}: {
  vendors: VendorOption[]
  action: (prev: RfqFormState, fd: FormData) => Promise<RfqFormState>
}) {
  const [state, formAction] = useActionState<RfqFormState, FormData>(action, {})
  const [rows, setRows] = useState<number[]>([++rowSeq])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const addRow = () => setRows((r) => [...r, ++rowSeq])
  const removeRow = (id: number) => setRows((r) => (r.length > 1 ? r.filter((x) => x !== id) : r))
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Card>
        <CardHeader><CardTitle>RFQ details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title" required className="sm:col-span-2">
            <Input id="title" name="title" required placeholder="e.g. Office Laptops Procurement — Q3" />
          </Field>
          <Field label="Category" htmlFor="category">
            <Select id="category" name="category" defaultValue="">
              <option value="">Select category…</option>
              {VENDOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Submission deadline" htmlFor="deadline">
            <Input id="deadline" name="deadline" type="date" />
          </Field>
          <Field label="Description" htmlFor="description" className="sm:col-span-2">
            <Textarea id="description" name="description" rows={3} placeholder="Scope, specifications, terms…" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="hidden gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid sm:grid-cols-[1fr_90px_90px_1fr_40px]">
            <span>Product / service</span><span>Qty</span><span>Unit</span><span>Note</span><span />
          </div>
          {rows.map((id) => (
            <div key={id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_90px_1fr_40px]">
              <Input name="item_name" placeholder="Laptop — Core i7" />
              <Input name="item_qty" type="number" min={1} step="any" defaultValue={1} />
              <Input name="item_unit" defaultValue="unit" />
              <Input name="item_desc" placeholder="Optional spec" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(id)}
                className="justify-self-start text-slate-400 hover:text-red-600 sm:justify-self-center"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite vendors {selected.size > 0 && <span className="text-slate-400">· {selected.size} selected</span>}</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors…" className="h-9 w-48 pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              No vendors yet. Register vendors first to invite them.
            </p>
          ) : (
            <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
              {filtered.map((v) => (
                <label
                  key={v.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition',
                    selected.has(v.id)
                      ? 'border-brand-300 bg-brand-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="checkbox"
                    name="vendor_ids"
                    value={v.id}
                    checked={selected.has(v.id)}
                    onChange={() => toggle(v.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{v.name}</span>
                    <span className="block truncate text-xs text-slate-400">{v.category ?? 'Uncategorized'}</span>
                  </span>
                  <Rating value={v.rating} showValue={false} />
                  <StatusBadge kind="vendor" value={v.status} />
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <SubmitButton variant="outline" name="status" value="draft">Save as draft</SubmitButton>
        <SubmitButton name="status" value="published">Publish &amp; invite</SubmitButton>
      </div>
    </form>
  )
}
