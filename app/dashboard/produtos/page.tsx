export const dynamic = 'force-dynamic'
import Link from 'next/link'
import connectDB from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product'
import { Button } from '@/components/ui/button'
import { ProductsTable } from '@/components/dashboard/products-table'
import { serialize } from '@/lib/db/serialize'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''
const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q = '', page = '1', status = '' } = await searchParams
  const currentPage = Math.max(1, parseInt(page, 10) || 1)
  const skip = (currentPage - 1) * PAGE_SIZE

  const filter: Record<string, unknown> = {
    storeId: DEFAULT_STORE_ID,
    isDeleted: false,
  }
  if (q)      filter.$text = { $search: q }
  if (status) filter.status = status

  let products: unknown[] = []
  let total = 0

  try {
    await connectDB()
    const [raw, count] = await Promise.all([
      Product.find(filter)
        .select('name slug price promoPrice status showOnSite isBestSeller images categoryId createdAt')
        .populate('categoryId', 'name')
        .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
      Product.countDocuments(filter),
    ])
    products = serialize(raw)
    total    = count
  } catch { /* sem banco configurado */ }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Monta URL de navegação preservando filtros ativos
  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (q)      params.set('q', q)
    if (status) params.set('status', status)
    params.set('page', String(p))
    return `/dashboard/produtos?${params.toString()}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} produto{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/produtos/novo" className="shrink-0">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
        <ProductsTable
          products={products as unknown as Parameters<typeof ProductsTable>[0]['products']}
          q={q}
          status={status}
        />
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Página {currentPage} de {totalPages}
            <span className="hidden sm:inline"> · {total} produtos</span>
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link href={buildUrl(currentPage - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-100 text-sm font-medium text-gray-300 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </span>
            )}

            {/* Números de página */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number
                if (totalPages <= 7) {
                  p = i + 1
                } else if (currentPage <= 4) {
                  p = i + 1
                } else if (currentPage >= totalPages - 3) {
                  p = totalPages - 6 + i
                } else {
                  p = currentPage - 3 + i
                }
                return (
                  <Link
                    key={p}
                    href={buildUrl(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </Link>
                )
              })}
            </div>

            {currentPage < totalPages ? (
              <Link href={buildUrl(currentPage + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-100 text-sm font-medium text-gray-300 cursor-not-allowed">
                Próxima
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
