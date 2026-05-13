'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus, Minus } from 'lucide-react'
import { cn, formatCurrency, getDiscountPercent } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { useTrack } from '@/hooks/use-track'
import { LightboxTrigger } from '@/components/ui/image-lightbox'

interface ProductCardProps {
  product: {
    _id: string
    name: string
    slug: string
    price: number
    promoPrice?: number
    images: Array<{ url: string; alt?: string }>
    tags: string[]
    categoryId?: { name: string; slug: string } | null
    description?: string
  }
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, items, updateQuantity } = useCart()
  const { track } = useTrack()

  const hasPromo     = product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price
  const displayPrice = hasPromo ? product.promoPrice! : product.price
  const discountPct  = hasPromo ? getDiscountPercent(product.price, product.promoPrice!) : 0
  const imageUrl     = product.images[0]?.url ?? `https://picsum.photos/seed/${product.slug}/400/300`

  const cartItem = items.find((i) => i.productId === product._id)
  const qty      = cartItem?.quantity ?? 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    addItem({ productId: product._id, name: product.name, price: displayPrice, quantity: 1, imageUrl })
    track('add_to_cart', product._id)
  }
  const handleInc = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    updateQuantity(product._id, qty + 1)
  }
  const handleDec = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    updateQuantity(product._id, qty - 1)
  }

  const plainDesc = product.description?.replace(/<[^>]+>/g, '').slice(0, 60)

  return (
    <Link
      href={`/produto/${product.slug}`}
      className={cn(
        'group flex gap-3',
        /* Mobile: linha horizontal */
        'items-center',
        /* Desktop: card vertical unificado */
        'md:flex-col md:items-stretch md:bg-white md:rounded-2xl md:border md:border-gray-100',
        'md:shadow-card md:hover:shadow-card-hover md:transition-shadow md:duration-200 md:overflow-hidden',
        className
      )}
    >
      {/* ── Imagem ─────────────────────────────────────────────── */}
      <LightboxTrigger src={imageUrl} alt={product.name} className={cn(
        'shrink-0 rounded-2xl overflow-hidden bg-gray-50',
        'w-[88px] h-[88px]',
        'md:w-full md:h-auto md:rounded-none md:aspect-[4/3]'
      )}>
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={product.images[0]?.alt ?? product.name}
            fill
            sizes="(max-width: 768px) 88px, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {hasPromo && (
            <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-red-500 rounded-lg px-1.5 py-0.5 leading-none shadow-sm z-10">
              -{discountPct}%
            </span>
          )}
        </div>
      </LightboxTrigger>

      {/* ── Informações ────────────────────────────────────────── */}
      <div className={cn(
        'flex-1 min-w-0 flex flex-col gap-1',
        /* Mobile: card branco próprio */
        'bg-white border border-gray-100 rounded-2xl p-3 shadow-sm',
        'transition-shadow duration-200 group-hover:shadow-card-hover',
        /* Desktop: sem borda própria — o card externo já envolve */
        'md:border-0 md:shadow-none md:hover:shadow-none md:rounded-none md:px-3 md:pt-2.5 md:pb-3'
      )}>
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {product.name}
        </p>

        {plainDesc && (
          <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed hidden md:block">
            {plainDesc}
          </p>
        )}

        {/* Preço + controles */}
        <div className="mt-auto pt-1.5 flex items-center justify-between gap-2">
          <div className="flex flex-col leading-none">
            {hasPromo && (
              <span className="text-[10px] text-gray-400 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
            <span className={cn(
              'font-bold leading-none',
              hasPromo ? 'text-red-600 text-[15px]' : 'text-gray-900 text-[15px]'
            )}>
              {formatCurrency(displayPrice)}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDec}
              disabled={qty === 0}
              className={cn(
                'w-6 h-6 rounded-lg border flex items-center justify-center transition-all',
                qty === 0
                  ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
              )}
              aria-label="Diminuir"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>

            <span className="w-4 text-center text-xs font-bold text-gray-800 tabular-nums">
              {qty}
            </span>

            <button
              onClick={qty === 0 ? handleAdd : handleInc}
              className="w-6 h-6 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white active:scale-95 transition-all shadow-sm"
              aria-label={qty === 0 ? `Adicionar ${product.name}` : 'Aumentar'}
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
