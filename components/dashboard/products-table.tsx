'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Edit, Eye, EyeOff, Trash2, Search, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Product {
  _id: string | { toString(): string }
  name: string
  slug: string
  price: number
  promoPrice?: number
  status: 'published' | 'draft' | 'inactive'
  showOnSite: boolean
  images: Array<{ url: string }>
  categoryId?: { name: string } | null
}

interface ProductsTableProps {
  products: Product[]
  q?: string
  status?: string
}

const statusBadge = {
  published: <Badge variant="success">Publicado</Badge>,
  draft:     <Badge variant="warning">Rascunho</Badge>,
  inactive:  <Badge variant="default">Inativo</Badge>,
}

const STATUS_OPTIONS = [
  { value: '',           label: 'Todos' },
  { value: 'published',  label: 'Publicados' },
  { value: 'draft',      label: 'Rascunhos' },
  { value: 'inactive',   label: 'Inativos' },
]

export function ProductsTable({ products, q = '', status = '' }: ProductsTableProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [search,   setSearch]   = useState(q)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const navigate = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = { q: search, status, page: '1', ...overrides }
    if (merged.q)      params.set('q', merged.q)
    if (merged.status) params.set('status', merged.status)
    params.set('page', merged.page)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ q: search, page: '1' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este produto? Esta ação pode ser revertida pelo suporte.')) return
    setDeleting(id)
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }


  return (
    <div>
      {/* Filtros */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:bg-white transition-all"
          />
        </form>

        {/* Filtro de status */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => navigate({ status: opt.value, page: '1' })}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                status === opt.value
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Categoria</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Site</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                  {q ? `Nenhum resultado para "${q}"` : 'Nenhum produto cadastrado'}
                </td>
              </tr>
            )}
            {products.map((product) => {
              const id = typeof product._id === 'string' ? product._id : product._id.toString()
              return (
                <tr key={id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {product.images[0]
                          ? <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                          : <div className="w-full h-full bg-gray-200" />}
                      </div>
                      <span className="font-medium text-gray-800 line-clamp-1 max-w-[160px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {product.categoryId?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 whitespace-nowrap">
                        {formatCurrency(product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price)}
                      </p>
                      {product.promoPrice && product.promoPrice > 0 && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{statusBadge[product.status]}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {product.showOnSite
                      ? <Eye className="w-4 h-4 text-green-500" />
                      : <EyeOff className="w-4 h-4 text-gray-300" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/dashboard/produtos/${id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(id)}
                        disabled={deleting === id}
                        className={cn(
                          'p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors',
                          deleting === id && 'opacity-50 cursor-not-allowed'
                        )}
                        title="Remover"
                      >
                        {deleting === id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
