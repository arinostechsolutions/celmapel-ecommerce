'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Package, Tag, ExternalLink, Receipt } from 'lucide-react'
import { formatDatetime, formatCurrency } from '@/lib/utils'

export interface OrderDetail {
  _id: string
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>
  subtotal: number
  discountAmount: number
  total: number
  createdAt: string | Date
  whatsappUrl?: string
  utmCampaign?: string
  utmSource?: string
  utmMedium?: string
}

interface OrderDetailsDrawerProps {
  order: OrderDetail | null
  onClose: () => void
}

export function OrderDetailsDrawer({ order, onClose }: OrderDetailsDrawerProps) {
  // Fecha com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    if (order) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [order])

  const id = order?._id ?? ''
  const hasDiscount = (order?.discountAmount ?? 0) > 0

  return (
    <AnimatePresence>
      {order && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">
                    Pedido #{id.slice(-6).toUpperCase()}
                  </h2>
                  <p className="text-xs text-gray-400">{formatDatetime(order.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Status */}
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl text-green-700 text-sm font-medium">
                <MessageCircle className="w-4 h-4" />
                Enviado ao WhatsApp
              </div>

              {/* Itens */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Itens do Pedido
                </p>
                <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.quantity}× {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumo</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Desconto
                    </span>
                    <span className="text-green-600 font-medium">− {formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span className="text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* UTM / Origem */}
              {(order.utmCampaign || order.utmSource) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Origem da visita</p>
                  <div className="flex flex-wrap gap-2">
                    {order.utmSource && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 font-mono">
                        src: {order.utmSource}
                      </span>
                    )}
                    {order.utmMedium && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 font-mono">
                        mid: {order.utmMedium}
                      </span>
                    )}
                    {order.utmCampaign && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 font-mono">
                        cmp: {order.utmCampaign}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {order.whatsappUrl && (
              <div className="px-5 py-4 border-t border-gray-100">
                <a
                  href={order.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Abrir no WhatsApp
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
