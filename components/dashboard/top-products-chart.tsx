'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface TopProductsChartProps {
  data: Array<{ name: string; count: number }>
  color?: string
}

export function TopProductsChart({ data, color = '#9333ea' }: TopProductsChartProps) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        Sem dados disponíveis
      </div>
    )
  }

  const truncated = data.map((d) => ({
    ...d,
    shortName: d.name.length > 20 ? d.name.slice(0, 18) + '…' : d.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={truncated} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
        <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: '#6b7280' }} width={110} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          formatter={(value) => [String(value), 'Ocorrências']}
          labelFormatter={(label) => data.find((d) => d.name.startsWith(label.replace('…', '')))?.name ?? label}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {truncated.map((_, i) => (
            <Cell key={i} fill={color} fillOpacity={1 - i * 0.08} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
