'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileBarChart2, RefreshCw, TrendingUp } from 'lucide-react'

interface ProdutoVendido {
  codigo: number
  produto: string
  total_vendido: number
  valor_total: string
}

const PERIODO_OPTIONS = [
  { label: 'Últimos 7 dias',  value: 7  },
  { label: 'Últimos 15 dias', value: 15 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 90 dias', value: 90 },
]

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-6" /></td>
      <td className="px-5 py-3">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
        <div className="h-3 bg-gray-100 rounded w-12" />
      </td>
      <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-14 ml-auto" /></td>
      <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-20 ml-auto" /></td>
      <td className="px-5 py-3"><div className="h-2 bg-gray-100 rounded-full w-full" /></td>
    </tr>
  )
}

export default function RelatorioPage() {
  const [produtos, setProdutos]   = useState<ProdutoVendido[]>([])
  const [loading, setLoading] = useState(true)
  const [dias, setDias]       = useState(7)
  const [limite, setLimite]   = useState(20)
  const [error, setError]     = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/relatorio/mais-vendidos?dias=${dias}&limite=${limite}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Erro ao carregar dados')
      setProdutos(json.data?.produtos ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [dias, limite])

  useEffect(() => { fetchData() }, [fetchData])

  const maxVendido = produtos[0]?.total_vendido ?? 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <FileBarChart2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Relatório de Vendas</h1>
            <p className="text-sm text-gray-500">Produtos mais vendidos por período</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40"
          aria-label="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDias(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dias === opt.value
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          value={limite}
          onChange={(e) => setLimite(Number(e.target.value))}
          className="h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-600">
          {error === 'Failed to fetch' ? 'Não foi possível conectar ao banco externo. Verifique a VPN.' : error}
        </div>
      )}

      {/* Tabela */}
      {!error && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 w-10">#</th>
                <th className="text-left px-5 py-3">Produto</th>
                <th className="text-right px-5 py-3 whitespace-nowrap">Qtd. vendida</th>
                <th className="text-right px-5 py-3 whitespace-nowrap">Faturamento</th>
                <th className="px-5 py-3 w-32 hidden sm:table-cell"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : produtos.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-sm text-gray-400">
                      Nenhuma venda encontrada no período
                    </td>
                  </tr>
                )
                : produtos.map((p, i) => (
                  <tr key={p.codigo} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400 font-medium text-xs">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 leading-tight">{p.produto}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Cód. {p.codigo}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        {p.total_vendido.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-700">
                      {formatCurrency(p.valor_total)}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full"
                          style={{ width: `${(p.total_vendido / maxVendido) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>

          {!loading && produtos.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
              <span>{produtos.length} produtos · dados do sistema VR</span>
              <span>
                Total no período:{' '}
                <strong className="text-gray-600">
                  {formatCurrency(produtos.reduce((s, p) => s + Number(p.valor_total), 0))}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
