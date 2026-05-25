'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'

interface ActivityLog {
  _id: string
  userName: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  product_created:        'Produto criado',
  product_updated:        'Produto atualizado',
  product_deleted:        'Produto excluído',
  product_status_changed: 'Status alterado',
  price_changed:          'Preço alterado',
  promo_price_changed:    'Preço promocional alterado',
  image_uploaded:         'Imagem enviada',
  image_deleted:          'Imagem removida',
  banner_created:         'Banner criado',
  banner_deleted:         'Banner excluído',
  category_created:       'Categoria criada',
  category_deleted:       'Categoria excluída',
  settings_updated:       'Configurações salvas',
  sync_started:           'Sincronização iniciada',
  sync_completed:         'Sincronização concluída',
  user_login:             'Login realizado',
  user_logout:            'Logout realizado',
  password_changed:       'Senha alterada',
  permissions_updated:    'Permissões atualizadas',
  user_role_changed:      'Função alterada',
}

const ACTION_COLORS: Record<string, string> = {
  product_created:     'bg-green-100 text-green-700',
  product_deleted:     'bg-red-100 text-red-700',
  price_changed:       'bg-amber-100 text-amber-700',
  promo_price_changed: 'bg-amber-100 text-amber-700',
  image_uploaded:      'bg-blue-100 text-blue-700',
  image_deleted:       'bg-red-100 text-red-700',
  settings_updated:    'bg-purple-100 text-purple-700',
  permissions_updated: 'bg-purple-100 text-purple-700',
  user_role_changed:   'bg-purple-100 text-purple-700',
  sync_started:        'bg-gray-100 text-gray-600',
  sync_completed:      'bg-green-100 text-green-700',
  user_login:          'bg-gray-100 text-gray-600',
  user_logout:         'bg-gray-100 text-gray-600',
  password_changed:    'bg-amber-100 text-amber-700',
}

const DETAIL_KEYS: Record<string, string> = {
  from:        'de',
  to:          'para',
  product:     'produto',
  count:       'quantidade',
  field:       'campo',
  role:        'função',
  targetUser:  'colaborador',
  permissions: 'permissões',
  name:        'nome',
}

function translateDetails(details: Record<string, unknown>): string {
  return Object.entries(details)
    .map(([k, v]) => {
      const label = DETAIL_KEYS[k] ?? k
      const value = Array.isArray(v) ? v.join(', ') : String(v)
      return `${label}: ${value}`
    })
    .join(' · ')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function LogsPage() {
  const [logs, setLogs]           = useState<ActivityLog[]>([])
  const [loading, setLoading]     = useState(true)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [hasMore, setHasMore]     = useState(false)
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = useCallback(async (cursor?: string, replace = true) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (cursor) params.set('cursor', cursor)
      if (actionFilter) params.set('action', actionFilter)
      const res = await fetch(`/api/activity-logs?${params}`)
      const json = await res.json()
      const items: ActivityLog[] = json.data?.logs ?? []
      setLogs((prev) => replace ? items : [...prev, ...items])
      setNextCursor(json.data?.nextCursor)
      setHasMore(json.data?.hasMore ?? false)
    } finally {
      setLoading(false)
    }
  }, [actionFilter])

  useEffect(() => { fetchLogs(undefined, true) }, [fetchLogs])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Logs de Atividade</h1>
            <p className="text-sm text-gray-500">Histórico de ações na plataforma</p>
          </div>
        </div>
        <button
          onClick={() => fetchLogs(undefined, true)}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filtro de ação */}
      <select
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        <option value="">Todas as ações</option>
        {Object.entries(ACTION_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Carregando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Nenhum log registrado ainda
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log._id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{log.userName}</span>
                    {log.entityId && (
                      <span className="text-gray-400 ml-1 font-mono text-xs">#{log.entityId.slice(-6)}</span>
                    )}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {translateDetails(log.details)}
                    </p>
                  )}
                </div>
                <time className="text-xs text-gray-400 shrink-0">{formatDate(log.createdAt)}</time>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => fetchLogs(nextCursor, false)}
              disabled={loading}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
            >
              Carregar mais
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
