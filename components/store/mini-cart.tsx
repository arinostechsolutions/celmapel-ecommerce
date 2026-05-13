'use client'

import Image from 'next/image'
import { X, Plus, Minus, Trash2, ShoppingBag, Package, CheckCircle2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useCart, useCartTotals } from '@/hooks/use-cart'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface MiniCartProps {
  /** ref do container pai para posicionamento correto */
  className?: string
}

export function MiniCart({ className }: MiniCartProps) {
  const {
    items, isMiniCartOpen, closeMiniCart, openCheckout,
    removeItem, updateQuantity,
    discountAmount, couponCode, setDiscount,
  } = useCart()
  const { subtotal, total, itemCount } = useCartTotals()

  const [couponInput, setCouponInput]     = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError]     = useState('')
  const [authChecking, setAuthChecking]   = useState(false)
  const [needsLogin, setNeedsLogin]       = useState(false)

  const handleCheckout = async () => {
    setAuthChecking(true)
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        setNeedsLogin(false)
        openCheckout()
      } else {
        setNeedsLogin(true)
      }
    } catch {
      setNeedsLogin(true)
    } finally {
      setAuthChecking(false)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_coupon', code: couponInput }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCouponError(data.error?.message ?? 'Cupom inválido')
      } else {
        setDiscount(couponInput.toUpperCase(), data.data?.discountAmount ?? 0)
        setCouponInput('')
      }
    } catch {
      setCouponError('Erro ao aplicar cupom')
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop transparente para fechar ao clicar fora */}
      {isMiniCartOpen && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden="true"
          onClick={closeMiniCart}
        />
      )}

      {/* Dropdown — mobile: fixo e full-width; desktop: dropdown âncora no ícone */}
      <div
        className={cn(
          /* mobile: posição fixa, ocupa toda a largura da tela com margem */
          'fixed left-2 right-2 top-[calc(var(--header-height)+8px)] z-50',
          /* md+: volta a ser absoluto e âncora no ícone */
          'md:absolute md:left-auto md:right-0 md:top-[calc(100%+10px)] md:w-80',
          'bg-white rounded-2xl shadow-2xl border border-gray-100',
          'flex flex-col max-h-[calc(100vh-90px)]',
          'transition-all duration-200 origin-top-right',
          isMiniCartOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none',
          className
        )}
        role="dialog"
        aria-label="Mini carrinho"
      >
        {/* Seta — só visível em desktop */}
        <div className="hidden md:block absolute -top-[9px] right-3.5 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45 rounded-sm" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-900">Meu Carrinho</span>
            {itemCount > 0 && (
              <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeMiniCart}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 px-4 py-2 space-y-0.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 opacity-40" />
              </div>
              <p className="text-sm font-medium mt-1">Carrinho vazio</p>
              <p className="text-xs text-center">Adicione produtos para começar</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                {/* Imagem */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs font-bold text-purple-700 mt-0.5">
                    {formatCurrency(item.price)}
                  </p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                      aria-label="Diminuir"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                      aria-label="Aumentar"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Subtotal item + remover */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xs font-bold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remover item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/50 rounded-b-2xl">
            {/* Cupom */}
            {!couponCode ? (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Cupom de desconto"
                    className="flex-1 h-8 px-3 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="h-8 px-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors shrink-0"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-3 py-1.5">
                <div className="flex items-center gap-1.5 text-green-700 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">{couponCode}</span>
                  <span>− {formatCurrency(discountAmount)}</span>
                </div>
                <button
                  onClick={() => { setDiscount('', 0); setCouponInput('') }}
                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  ×
                </button>
              </div>
            )}

            {/* Totais */}
            <div className="space-y-1">
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-green-600 font-medium">
                  <span>Desconto</span>
                  <span>− {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-gray-900">
                <span>Total</span>
                <span className="text-purple-700">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Gate de login */}
            {needsLogin ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <LogIn className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Login necessário</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Para finalizar o pedido, faça login. Seu carrinho será mantido.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/auth/login?next=checkout"
                    onClick={closeMiniCart}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Entrar
                  </Link>
                  <Link
                    href="/auth/cadastro"
                    onClick={closeMiniCart}
                    className="flex-1 flex items-center justify-center h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Criar conta
                  </Link>
                </div>
                <button
                  onClick={() => setNeedsLogin(false)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <Button
                className="w-full h-10 text-sm font-semibold gap-2"
                onClick={handleCheckout}
                loading={authChecking}
              >
                Finalizar pedido →
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
