import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = typeof value === 'string' ? parseISO(value) : value
  return isNaN(d.getTime()) ? null : d
}

/** Indian Rupee formatting (lakh/crore grouping). */
export function formatCurrency(
  value: number | string | null | undefined,
  opts: { decimals?: boolean } = {}
) {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(isNaN(n) ? 0 : n)
}

export function formatNumber(value: number | string | null | undefined) {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat('en-IN').format(isNaN(n) ? 0 : n)
}

export function formatDate(value: string | Date | null | undefined) {
  const d = toDate(value)
  return d ? format(d, 'dd MMM yyyy') : '—'
}

export function formatDateTime(value: string | Date | null | undefined) {
  const d = toDate(value)
  return d ? format(d, 'dd MMM yyyy, h:mm a') : '—'
}

export function formatRelative(value: string | Date | null | undefined) {
  const d = toDate(value)
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '—'
}

/** Days until a deadline (negative = overdue). null if no date. */
export function daysUntil(value: string | Date | null | undefined): number | null {
  const d = toDate(value)
  if (!d) return null
  const ms = d.getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export function initials(name: string | null | undefined) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : plural ?? `${singular}s`
}

/** Stable colour index for vendor avatars etc. */
export function hashIndex(str: string, mod: number) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000
  return h % mod
}
