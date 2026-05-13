'use client'

import Image from 'next/image'
import { X, MessageCircle, ArrowLeft, Package } from 'lucide-react'
import { useState } from 'react'
import { useCart, useCartTotals } from '@/hooks/use-cart'
import { useTrack } from '@/hooks/use-track'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * Drawer de confirmação de pedido — abre após "Finalizar pedido" no MiniCart.
 * Mostra resumo completo e envia para WhatsApp.
 */
export function CartDrawer() {
  const {
    items, isCheckoutOpen, closeCheckout, openMiniCart,
    discountAmount, couponCode,
    clearCart,
  } = useCart()
  const { subtotal, total } = useCartTotals()

  const { track } = useTrack()
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderError, setOrderError] = useState('')

  const onClose = () => closeCheckout()
  const onBack = () => { closeCheckout(); openMiniCart() }

  const handleOrder = async () => {
    setIsOrdering(true)
    setOrderError('')
    try {
      const utmParams = Object.fromEntries(new URLSearchParams(window.location.search))
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name:      i.name,
            price:     i.price,
            quantity:  i.quantity,
            imageUrl:  i.imageUrl,
          })),
          discountAmount,
          couponCode: couponCode || undefined,
          utmSource:   utmParams.utm_source,
          utmMedium:   utmParams.utm_medium,
          utmCampaign: utmParams.utm_campaign,
        }),
      })
      const data = await res.json()
      if (data.data?.whatsappUrl) {
        // Registra checkout_initiated para cada produto no carrinho
        items.forEach((item) => track('checkout_initiated', item.productId))
        clearCart()
        closeCheckout()
        window.open(data.data.whatsappUrl, '_blank', 'noopener,noreferrer')
      } else {
        setOrderError(data.error?.message ?? 'Erro ao gerar pedido. Tente novamente.')
      }
    } catch {
      setOrderError('Não foi possível conectar. Verifique sua conexão.')
    } finally {
      setIsOrdering(false)
    }
  }

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isCheckoutOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl',
          'transition-transform duration-300 flex flex-col',
          isCheckoutOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Confirmar pedido"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-gray-900">Finalizar Compra</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Resumo do pedido
          </p>

          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity}× {formatCurrency(item.price)}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900 shrink-0">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}

          {/* Totais */}
          <div className="bg-gray-50 rounded-2xl p-4 mt-2 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal ({totalQty} {totalQty === 1 ? 'item' : 'itens'})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Cupom {couponCode}</span>
                <span>− {formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Frete</span>
              <span className="text-green-600 font-medium">A combinar</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-purple-700">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Info WhatsApp */}
          <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl p-4">
            <MessageCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Pedido via WhatsApp</p>
              <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                Vamos abrir o WhatsApp com o resumo do seu pedido. Nosso atendente confirmará pagamento e entrega.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-white">
          {orderError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{orderError}</p>
          )}
          <Button
            className="w-full gap-2 h-12 text-sm font-semibold bg-green-600 hover:bg-green-700"
            onClick={handleOrder}
            loading={isOrdering}
          >
            <MessageCircle className="w-5 h-5" />
            Finalizar compra pelo WhatsApp
          </Button>
          <button
            onClick={onBack}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-1 transition-colors"
          >
            Voltar e editar carrinho
          </button>
        </div>
      </div>
    </>
  )
}
