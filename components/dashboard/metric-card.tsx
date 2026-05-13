import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  change?: number
  changeLabel?: string
  color?: 'purple' | 'pink' | 'green' | 'blue' | 'amber'
  className?: string
}

const colorMap = {
  purple: { icon: 'bg-purple-100 text-purple-600', ring: 'ring-purple-100' },
  pink:   { icon: 'bg-pink-100   text-pink-600',   ring: 'ring-pink-100'   },
  green:  { icon: 'bg-green-100  text-green-600',  ring: 'ring-green-100'  },
  blue:   { icon: 'bg-blue-100   text-blue-600',   ring: 'ring-blue-100'   },
  amber:  { icon: 'bg-amber-100  text-amber-600',  ring: 'ring-amber-100'  },
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = 'purple',
  className,
}: MetricCardProps) {
  const colors = colorMap[color]
  const isPositive = change !== undefined && change >= 0

  return (
    <div className={cn('bg-white rounded-2xl p-5 border border-gray-100 shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(change).toFixed(1)}% {changeLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
