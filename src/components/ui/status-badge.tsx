import { Badge } from './badge'
import {
  VENDOR_STATUS, RFQ_STATUS, QUOTATION_STATUS,
  APPROVAL_STATUS, PO_STATUS, INVOICE_STATUS, type BadgeTone,
} from '@/lib/constants'

const MAPS = {
  vendor: VENDOR_STATUS,
  rfq: RFQ_STATUS,
  quotation: QUOTATION_STATUS,
  approval: APPROVAL_STATUS,
  po: PO_STATUS,
  invoice: INVOICE_STATUS,
} as const

export function StatusBadge({ kind, value }: { kind: keyof typeof MAPS; value: string }) {
  const meta = (MAPS[kind] as Record<string, { label: string; tone: BadgeTone }>)[value] ?? {
    label: value,
    tone: 'gray' as BadgeTone,
  }
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}
