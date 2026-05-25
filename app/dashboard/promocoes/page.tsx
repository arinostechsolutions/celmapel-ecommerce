'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Percent, Save, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Product {
  _id: string
  name: string
  sku?: string
  externalId?: string
  price: number
  promoPrice?: number
  status: string
}

const PAGE_SIZE = 20

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded w-3/4 mb-1" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded w-14 ml-auto" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded w-14 ml-auto" />
      </td>
      <td className="px-4 py-3">
        <div className="h-7 bg-gray-100 rounded-lg w-12 ml-auto" />
      </td>
    </tr>
  )
}

export default function PromocoesPage() {
  const [products, setProducts]   = useState<Product[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cursors, setCursors]     = useState<Record<number, string>>({})
  const [saving, setSaving]       = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  const fetchPage = useCallback(async (q: string, targetPage: number, cursorMap: Record<number, string>) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), dashboard: 'true' })
      if (q) params.set('q', q)
      if (targetPage > 1 && cursorMap[targetPage]) params.set('cursor', cursorMap[targetPage])

      const res = await fetch(`/api/products?${params}`)
      const json = await res.json()
      const items: Product[] = json.data?.products ?? []
      setProducts(items)

      if (json.data?.nextCursor) {
        setCursors((prev) => ({ ...prev, [targetPage + 1]: json.data.nextCursor }))
      }

      // Estima total de páginas: se retornou hasMore, há pelo menos mais uma
      if (json.data?.hasMore) {
        setTotalPages((prev) => Math.max(prev, targetPage + 1))
      } else {
        setTotalPages(targetPage)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Busca inicial
  useEffect(() => {
    fetchPage('', 1, {})
  }, [fetchPage])

  // Debounce na busca — reseta para página 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setCursors({})
      setTotalPages(1)
      fetchPage(search, 1, {})
    }, 400)
    return () => clearTimeout(timer)
  }, [search, fetchPage])

  const goToPage = (p: number) => {
    setPage(p)
    fetchPage(search, p, cursors)
  }

  const startEdit = (product: Product) => {
    setEditingId(product._id)
    setEditPrice(product.promoPrice ? String(product.promoPrice).replace('.', ',') : '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPrice('')
  }

  const savePromoPrice = async (product: Product) => {
    setSaving(product._id)
    const promo = editPrice.replace(',', '.')
    const promoPrice = promo ? parseFloat(promo) : null
    try {
      await fetch(`/api/products/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoPrice }),
      })
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, promoPrice: promoPrice ?? undefined } : p
        )
      )
      cancelEdit()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Percent className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Promoções</h1>
          <p className="text-sm text-gray-500">Defina preços promocionais por produto</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou código interno..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:bg-white transition-all"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Produto</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Código</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Preço</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Promoção</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-sm text-gray-400">
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.status}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell font-mono text-xs">
                    {product.externalId ?? product.sku ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === product._id ? (
                      <input
                        type="text"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="0,00"
                        autoFocus
                        className="w-24 text-right border border-purple-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                      />
                    ) : (
                      <span
                        className={product.promoPrice ? 'text-green-600 font-semibold cursor-pointer' : 'text-gray-300 cursor-pointer'}
                        onClick={() => startEdit(product)}
                      >
                        {product.promoPrice ? formatCurrency(product.promoPrice) : '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === product._id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => savePromoPrice(product)}
                          disabled={saving === product._id}
                          className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => startEdit(product)}
                        className="text-xs h-7 px-2 bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors rounded-lg"
                      >
                        Editar
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1 || loading}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        page === p
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages || loading}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
