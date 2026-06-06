'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExportButton({
  rows,
  filename = 'report.csv',
  label = 'Export CSV',
}: {
  rows: Record<string, string | number>[]
  filename?: string
  label?: string
}) {
  function download() {
    if (rows.length === 0) return
    const headers = Object.keys(rows[0])
    const escape = (v: string | number) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={rows.length === 0}>
      <Download className="h-4 w-4" /> {label}
    </Button>
  )
}
