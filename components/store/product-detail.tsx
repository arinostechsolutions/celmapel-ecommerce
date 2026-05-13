'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus, Share2, Check } from 'lucide-react'
import { LightboxTrigger } from '@/components/ui/image-lightbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductCard } from './product-card'
import { ProductsSection } from './products-section'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency, getDiscountPercent } from '@/lib/utils'

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  promoPrice?: number
  images: Array<{ url: string; alt?: string; order: number; publicId: string }>
  tags: string[]
  variations: Array<{ name: string; options: string[] }>
  categoryId?: { name: string; slug: string } | null
}

interface ProductDetailProps {
  product: Product
  related: Product[]
}

export function ProductDetail({ product, related }: ProductDetailProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [added, setAdded] = useState(false)
  const [shared, setShared] = useState(false)
  const { addItem } = useCart()

  const hasPromo = product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price
  const displayPrice = hasPromo ? product.promoPrice! : product.price
  const discountPct = hasPromo ? getDiscountPercent(product.price, product.promoPrice!) : 0
  const images = product.images.length > 0
    ? product.images
    : [{ url: `https://picsum.photos/seed/${product._id}/600/600`, alt: product.name, order: 0, publicId: '' }]

  const handleAddToCart = () => {
    addItem({
      productId: product._id,
      name: product.name,
      price: displayPrice,
      quantity,
      imageUrl: images[0]?.url,
      selectedVariations,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleShare = async () => {
    const url  = typeof window !== 'undefined' ? window.location.href : ''
    const text = `${product.name} por ${formatCurrency(displayPrice)} — confira na loja!`

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text, url })
        return
      } catch { /* usuário cancelou */ }
    }

    // Fallback: WhatsApp
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
    window.open(wa, '_blank', 'noopener')
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const prevImage = () => setActiveImage((i) => (i - 1 + images.length) % images.length)
  const nextImage = () => setActiveImage((i) => (i + 1) % images.length)

  return (
    <div className="space-y-10">
      {/* Product */}
      <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 lg:gap-10">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 md:max-h-[360px] md:mx-auto md:w-full">
            <LightboxTrigger src={images[activeImage].url} alt={images[activeImage].alt ?? product.name} className="absolute inset-0">
              <div className="relative w-full h-full">
                <Image
                  src={images[activeImage].url}
                  alt={images[activeImage].alt ?? product.name}
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </LightboxTrigger>
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scroll-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors bg-white ${i === activeImage ? 'border-purple-500' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <LightboxTrigger src={img.url} alt={img.alt ?? product.name} className="absolute inset-0">
                    <div className="relative w-full h-full">
                      <Image src={img.url} alt={img.alt ?? ''} fill className="object-contain p-1" />
                    </div>
                  </LightboxTrigger>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.categoryId && (
            <p className="text-sm text-purple-600 font-medium">{product.categoryId.name}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="purple" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Preço */}
          <div>
            {hasPromo && (
              <p className="text-base text-gray-400 line-through">{formatCurrency(product.price)}</p>
            )}
            <div className="flex items-baseline gap-3">
              <p className={`text-3xl font-bold ${hasPromo ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(displayPrice)}
              </p>
              {hasPromo && (
                <Badge variant="danger" className="text-sm px-2.5 py-1">-{discountPct}%</Badge>
              )}
            </div>
          </div>

          {/* Variações */}
          {product.variations.map((variation) => (
            <div key={variation.name} className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{variation.name}</p>
              <div className="flex flex-wrap gap-2">
                {variation.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedVariations((prev) => ({ ...prev, [variation.name]: option }))}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariations[variation.name] === option
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* ── Mobile: ação compacta inline ─────────────────── */}
          <div className="md:hidden bg-gray-50 rounded-2xl p-3 space-y-3">
            {/* Linha: qty + botão adicionar + compartilhar */}
            <div className="flex items-center gap-2">
              {/* Qty */}
              <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 px-1 py-1">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 active:scale-95 transition-all">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-bold tabular-nums">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 active:scale-95 transition-all">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Adicionar */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm ${
                  added ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'
                }`}
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                {added ? 'Adicionado!' : 'Adicionar ao carrinho'}
              </button>

              {/* Compartilhar */}
              <button onClick={handleShare}
                className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 active:scale-95 transition-all shrink-0">
                {shared ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ── Desktop: quantidade + ações ──────────────────────── */}
          <div className="hidden md:flex items-center gap-3 pt-1">
            {/* Qty */}
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-2 py-1.5 border border-gray-100">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-800 transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center text-sm font-bold tabular-nums">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-800 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Adicionar */}
            <button onClick={handleAddToCart}
              className={`h-10 px-5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-[0.98] ${
                added ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}>
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? 'Adicionado!' : 'Adicionar ao carrinho'}
            </button>

            {/* Compartilhar */}
            <button onClick={handleShare}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-colors"
              title="Compartilhar">
              {shared ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Descrição */}
          {product.description && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">Descrição</h3>
              <div
                className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <ProductsSection
          title="Você também pode gostar"
          products={related as Parameters<typeof ProductCard>[0]['product'][]}
        />
      )}
    </div>
  )
}
