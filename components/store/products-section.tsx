import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ProductCard } from './product-card'
import { cn } from '@/lib/utils'

interface ProductsSectionProps {
  title: string
  products: Parameters<typeof ProductCard>[0]['product'][]
  viewAllHref?: string
  highlight?: boolean
}

export function ProductsSection({ title, products, viewAllHref, highlight }: ProductsSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2
          className={cn(
            'text-lg font-bold',
            highlight ? 'text-red-600' : 'text-gray-900'
          )}
        >
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  )
}
