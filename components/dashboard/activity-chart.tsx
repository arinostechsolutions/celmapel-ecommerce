'use client'

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { DayActivity } from '@/app/dashboard/page'

interface ActivityChartProps {
  data: DayActivity[]
}

const SERIES = [
  { key: 'view',               label: 'Visualizações', color: '#818cf8' },
  { key: 'add_to_cart',        label: 'Carrinho',       color: '#9333ea' },
  { key: 'checkout_initiated', label: 'WhatsApp',       color: '#ec4899' },
] as const

export function ActivityChart({ data }: ActivityChartProps) {
  if (!data.length) {
    return (
      <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
        Sem dados disponíveis
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          formatter={(value, name) => {
            const s = SERIES.find((s) => s.key === name)
            return [String(value), s?.label ?? String(name)]
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => SERIES.find((s) => s.key === value)?.label ?? value}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {SERIES.map(({ key, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
