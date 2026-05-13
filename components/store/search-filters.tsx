'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { SlidersHorizontal } from 'lucide-react'

interface Category {
  _id: string
  name: string
  slug: string
}

interface SearchFiltersProps {
  categories: Category[]
}

export function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams((searchParams?.toString() ?? ""))
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/busca?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <aside className="w-full lg:w-56 shrink-0 space-y-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <SlidersHorizontal className="w-4 h-4 text-purple-600" />
        Filtros
      </div>

      {/* Categorias */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Categoria</p>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => updateParam('categoryId', null)}
              className={`text-sm w-full text-left px-2 py-1 rounded-lg transition-colors ${
                !searchParams?.get('categoryId')
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todas
            </button>
          </li>
          {categories.map((cat) => (
            <li key={String(cat._id)}>
              <button
                onClick={() => updateParam('categoryId', String(cat._id))}
                className={`text-sm w-full text-left px-2 py-1 rounded-lg transition-colors ${
                  searchParams?.get('categoryId') === String(cat._id)
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Ordenacao */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ordenar por</p>
        <select
          value={searchParams?.get('sort') ?? 'createdAt'}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="w-full h-9 px-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <option value="createdAt">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="orderCount">Mais vendidos</option>
          <option value="viewCount">Mais visualizados</option>
        </select>
      </div>

      {/* Faixa de preço */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preço</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            defaultValue={searchParams?.get('minPrice') ?? ''}
            onChange={(e) => updateParam('minPrice', e.target.value || null)}
            className="w-full h-9 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            placeholder="Máx"
            defaultValue={searchParams?.get('maxPrice') ?? ''}
            onChange={(e) => updateParam('maxPrice', e.target.value || null)}
            className="w-full h-9 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          />
        </div>
      </div>
    </aside>
  )
}
