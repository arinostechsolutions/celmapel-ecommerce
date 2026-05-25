export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import connectDB from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product'
import Category from '@/lib/db/models/category'
import { ProductCard } from '@/components/store/product-card'
import { FilterBar } from '@/components/store/filter-bar'
import { serialize } from '@/lib/db/serialize'
import { Search } from 'lucide-react'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    categoryId?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const { q, categoryId, sort = 'createdAt', minPrice, maxPrice } = params

  const query: Record<string, unknown> = {
    storeId: DEFAULT_STORE_ID,
    isDeleted: false,
    status: 'published',
    showOnSite: true,
  }

  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    query.$or = [{ name: re }, { description: re }, { tags: re }, { sku: re }]
  }
  if (categoryId) query.categoryId = categoryId
  if (minPrice || maxPrice) {
    query.price = {
      ...(minPrice ? { $gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { $lte: parseFloat(maxPrice) } : {}),
    }
  }

  const sortMap: Record<string, Record<string, number>> = {
    createdAt:  { createdAt: -1 },
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    orderCount: { orderCount: -1 },
    viewCount:  { viewCount: -1 },
  }

  const sortOrder = sortMap[sort] ?? { createdAt: -1 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: Array<Record<string, any>> = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let categories: Array<Record<string, any>> = []

  try {
    await connectDB()
    const [rawProducts, rawCategories] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .sort(sortOrder as Parameters<ReturnType<typeof Product.find>['sort']>[0])
        .limit(48)
        .lean(),
      Category.find({ storeId: DEFAULT_STORE_ID, isDeleted: false, isVisible: true })
        .sort({ order: 1 })
        .lean(),
    ])
    products   = serialize(rawProducts)
    categories = serialize(rawCategories)
  } catch {
    // retorna listas vazias
  }

  return (
    <div>
      {/* Cabeçalho da busca */}
      {q && (
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-lg font-bold text-gray-900">
            Resultados para &ldquo;{q}&rdquo;
          </h1>
        </div>
      )}

      {/* Barra de filtros com chips de categoria */}
      <Suspense>
        <FilterBar
          categories={categories as unknown as Parameters<typeof FilterBar>[0]['categories']}
          totalProducts={products.length}
        />
      </Suspense>

      {/* Grade de produtos */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <Search className="w-12 h-12 opacity-30" />
            <p className="text-base font-medium">Nenhum produto encontrado</p>
            <p className="text-sm">Tente outros termos ou remova os filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product as unknown as Parameters<typeof ProductCard>[0]['product']}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
