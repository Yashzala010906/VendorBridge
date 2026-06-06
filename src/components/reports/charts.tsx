'use client'

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

function compact(v: number) {
  return '₹' + new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

const axis = { stroke: '#94a3b8', fontSize: 12 }

export function SpendTrendChart({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="spendG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} {...axis} />
        <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={52} {...axis} />
        <Tooltip
          formatter={(v: any) => [formatCurrency(Number(v ?? 0)), 'Spend']}
          contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2} fill="url(#spendG)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function StatusPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.every((d) => d.value === 0)) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No data yet</div>
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={2}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function TopVendorsChart({ data }: { data: { name: string; amount: number }[] }) {
  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No data yet</div>
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#eef2f7" />
        <XAxis type="number" tickFormatter={compact} tickLine={false} axisLine={false} {...axis} />
        <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} {...axis} />
        <Tooltip
          formatter={(v: any) => [formatCurrency(Number(v ?? 0)), 'Spend']}
          contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
          cursor={{ fill: '#f8fafc' }}
        />
        <Bar dataKey="amount" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}
