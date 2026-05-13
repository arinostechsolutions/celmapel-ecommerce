import { Eye, ShoppingCart, MessageCircle, Megaphone } from 'lucide-react'

interface ConversionFunnelProps {
  views: number
  cartAdds: number
  checkouts: number
  activeCampaigns: number
}

interface FunnelStep {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  pct: string
  color: string
  bg: string
}

export function ConversionFunnel({ views, cartAdds, checkouts, activeCampaigns }: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    {
      icon: Eye,
      label: 'Visualizações',
      value: views,
      pct: '100%',
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
    },
    {
      icon: ShoppingCart,
      label: 'Adicionados ao carrinho',
      value: cartAdds,
      pct: views > 0 ? `${((cartAdds / views) * 100).toFixed(1)}%` : '—',
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
    {
      icon: MessageCircle,
      label: 'Checkout via WhatsApp',
      value: checkouts,
      pct: views > 0 ? `${((checkouts / views) * 100).toFixed(1)}%` : '—',
      color: 'text-pink-700',
      bg: 'bg-pink-50',
    },
  ]

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Funil de Conversão</h2>
        <p className="text-xs text-gray-400 mt-0.5">Últimos 30 dias</p>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          const barWidth = views > 0
            ? `${Math.max(((step.value / views) * 100), step.value > 0 ? 8 : 0)}%`
            : '0%'

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-lg ${step.bg} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                  </div>
                  <span className="text-gray-600 font-medium">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{step.value.toLocaleString('pt-BR')}</span>
                  <span className={`text-[11px] font-medium ${step.color} w-10 text-right`}>{step.pct}</span>
                </div>
              </div>
              {/* Barra proporcional */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${step.bg.replace('50', '400')}`}
                  style={{ width: barWidth }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t border-gray-50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Megaphone className="w-3.5 h-3.5 text-orange-400" />
            <span>Campanhas ativas</span>
          </div>
          <span className="font-bold text-gray-900">{activeCampaigns}</span>
        </div>
      </div>
    </div>
  )
}
