'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { Tag } from 'lucide-react'

interface Category { _id: string; name: string; icon?: string }

interface FilterBarProps {
  categories: Category[]
  totalProducts: number
}

const SORT_OPTIONS = [
  { value: 'createdAt',  label: 'Mais recentes' },
  { value: 'price_asc',  label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'orderCount', label: 'Mais vendidos' },
  { value: 'viewCount',  label: 'Mais vistos' },
]

export function FilterBar({ categories, totalProducts }: FilterBarProps) {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeCategoryId = searchParams?.get('categoryId')
  const activeSort       = searchParams?.get('sort') ?? 'createdAt'
  const activeMinPrice   = searchParams?.get('minPrice') ?? ''
  const activeMaxPrice   = searchParams?.get('maxPrice') ?? ''

  const [minPrice, setMinPrice] = useState(activeMinPrice)
  const [maxPrice, setMaxPrice] = useState(activeMaxPrice)

  const activeFilterCount = [
    activeCategoryId,
    activeSort !== 'createdAt' ? activeSort : null,
    activeMinPrice,
    activeMaxPrice,
  ].filter(Boolean).length

  const navigate = useCallback((overrides: Record<string, string | null>) => {
    const params = new URLSearchParams((searchParams?.toString() ?? ""))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k)
    })
    router.push(`/busca?${params.toString()}`)
  }, [router, searchParams])

  const applyPriceFilter = () => {
    navigate({ minPrice: minPrice || null, maxPrice: maxPrice || null })
    setSheetOpen(false)
  }

  const clearAll = () => {
    setMinPrice('')
    setMaxPrice('')
    router.push('/busca')
    setSheetOpen(false)
  }

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? 'Mais recentes'

  return (
    <>
      {/* ─── Barra de categorias + botão de filtros ─────────────────────── */}
      <div className="sticky top-[calc(var(--header-height)+var(--category-bar-height))] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-2.5">
            {/* Chips de categorias (scroll horizontal) */}
            <div className="flex-1 overflow-x-auto scroll-hide">
              <div className="flex items-center gap-1.5 pr-2">
                {/* Todos */}
                <button
                  onClick={() => navigate({ categoryId: null })}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                    !activeCategoryId
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Todos
                </button>

                {categories.map((cat) => {
                  const isActive = activeCategoryId === cat._id
                  const IconComp = cat.icon
                    ? ((Icons[cat.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>) ?? Tag)
                    : Tag

                  return (
                    <button
                      key={cat._id}
                      onClick={() => navigate({ categoryId: cat._id })}
                      className={cn(
                        'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm scale-[1.03]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <IconComp className="w-3 h-3" />
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Separador */}
            <div className="h-6 w-px bg-gray-200 shrink-0" />

            {/* Botão Filtros */}
            <button
              onClick={() => setSheetOpen(true)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                activeFilterCount > 0
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Info de resultados */}
          <div className="flex items-center justify-between pb-2 text-xs text-gray-400">
            <span>{totalProducts} produto{totalProducts !== 1 ? 's' : ''}</span>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-purple-600 font-medium hover:text-purple-800 transition-colors">
                <X className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Overlay ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSheetOpen(false)}
      />

      {/* ─── Filter Sheet (bottom mobile / right desktop) ─────────────────── */}
      <div
        className={cn(
          // Mobile: slide from bottom
          'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl',
          // Desktop: side drawer
          'lg:bottom-auto lg:top-0 lg:left-auto lg:right-0 lg:h-full lg:w-80 lg:rounded-none lg:rounded-l-3xl',
          'transition-transform duration-300 ease-out',
          sheetOpen
            ? 'translate-y-0 lg:translate-x-0'
            : 'translate-y-full lg:translate-y-0 lg:translate-x-full'
        )}
      >
        {/* Handle (mobile only) */}
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            Filtros e ordenação
          </h2>
          <button
            onClick={() => setSheetOpen(false)}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-80px)]">

          {/* Ordenar por */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordenar por</p>
            <div className="grid grid-cols-1 gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { navigate({ sort: opt.value }); setSheetOpen(false) }}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
                    activeSort === opt.value
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  {opt.label}
                  {activeSort === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Faixa de preço */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Faixa de preço</p>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                <input
                  type="number"
                  placeholder="Mín"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-10 pl-8 pr-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <span className="text-gray-300 text-sm font-light">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-10 pl-8 pr-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>
            <button
              onClick={applyPriceFilter}
              className="w-full h-10 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Aplicar preço
            </button>
          </div>
        </div>

        {/* Footer do sheet */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={clearAll}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Limpar tudo
          </button>
          <button
            onClick={() => setSheetOpen(false)}
            className="flex-1 h-10 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  )
}
