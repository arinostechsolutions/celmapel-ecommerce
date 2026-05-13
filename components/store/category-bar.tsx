'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { Tag } from 'lucide-react'

interface Category {
  _id: string
  name: string
  slug: string
  icon: string
}

interface CategoryBarProps {
  categories: Category[]
}

export function CategoryBar({ categories }: CategoryBarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCategoryId = searchParams?.get('categoryId')

  const isHome = pathname === '/' && !currentCategoryId

  return (
    <nav
      className="sticky top-[var(--header-height)] z-40 bg-white border-b border-gray-100"
      style={{ height: 'var(--category-bar-height)' }}
      aria-label="Categorias"
    >
      <div className="max-w-7xl mx-auto px-4 h-full">
        <ul className="flex items-center gap-1 h-full overflow-x-auto scroll-hide">
          {/* Todos */}
          <li className="shrink-0">
            <Link
              href="/"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                isHome
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
              )}
            >
              {(() => {
                const Grid = Icons['Grid3X3' as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined
                return Grid ? <Grid className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />
              })()}
              Todos
            </Link>
          </li>

          {/* Categorias */}
          {categories.map((cat) => {
            const isActive = currentCategoryId === cat._id
            const IconComponent =
              (Icons[cat.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>) ?? Tag

            return (
              <li key={cat._id} className="shrink-0">
                <Link
                  href={`/busca?categoryId=${cat._id}`}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                  )}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  {cat.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
