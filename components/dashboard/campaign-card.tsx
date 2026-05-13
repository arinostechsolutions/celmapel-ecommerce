'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, MousePointerClick } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CampaignCardProps {
  campaign: {
    id: string
    name: string
    description?: string
    isActive: boolean
    clickCount: number
    utmSource: string
    utmMedium: string
    utmCampaign: string
    startDate: string
    endDate: string
    utmUrl: string
  }
}

export function CampaignCard({ campaign: c }: CampaignCardProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(c.utmUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 md:p-5 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{c.name}</h3>
            <Badge variant={c.isActive ? 'success' : 'default'}>
              {c.isActive ? 'Ativa' : 'Pausada'}
            </Badge>
          </div>
          {c.description && (
            <p className="text-sm text-gray-500">{c.description}</p>
          )}
        </div>

        {/* Cliques */}
        <div className="shrink-0 text-center bg-purple-50 rounded-xl px-3 py-2 min-w-[64px]">
          <div className="flex items-center justify-center gap-1 text-purple-700">
            <MousePointerClick className="w-3.5 h-3.5" />
            <span className="text-lg font-bold">{c.clickCount.toLocaleString('pt-BR')}</span>
          </div>
          <p className="text-[10px] text-purple-500 font-medium">cliques</p>
        </div>
      </div>

      {/* UTM badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="purple">src: {c.utmSource}</Badge>
        <Badge variant="purple">mid: {c.utmMedium}</Badge>
        <Badge variant="purple">cmp: {c.utmCampaign}</Badge>
      </div>

      {/* Link rastreável */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Link rastreável</p>
          <div className="flex items-center gap-1">
            <button
              onClick={copy}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                copied ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200 text-gray-600'
              )}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <a
              href={c.utmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Testar
            </a>
          </div>
        </div>
        {/* URL com scroll horizontal controlado em vez de quebrar layout */}
        <div className="overflow-x-auto rounded-lg">
          <code className="block text-xs text-gray-600 whitespace-nowrap pb-0.5">
            {c.utmUrl}
          </code>
        </div>
      </div>

      {/* Período */}
      <p className="text-xs text-gray-400">{c.startDate} — {c.endDate}</p>
    </div>
  )
}
