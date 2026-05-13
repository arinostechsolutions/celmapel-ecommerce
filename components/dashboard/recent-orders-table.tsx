'use client'

import { useState } from 'react'
import { formatDatetime, formatCurrency } from '@/lib/utils'
import { MessageCircle, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OrderDetailsDrawer, type OrderDetail } from './order-details-drawer'

interface Order {
  _id: string | { toString(): string }
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>
  subtotal: number
  discountAmount: number
  total: number
  createdAt: Date | string
  whatsappUrl?: string
  utmCampaign?: string
  utmSource?: string
  utmMedium?: string
}

interface RecentOrdersTableProps {
  orders: Order[]
}

function toDetail(order: Order): OrderDetail {
  const id = typeof order._id === 'string' ? order._id : order._id.toString()
  return {
    _id:            id,
    items:          order.items,
    subtotal:       order.subtotal,
    discountAmount: order.discountAmount,
    total:          order.total,
    createdAt:      order.createdAt,
    whatsappUrl:    order.whatsappUrl,
    utmCampaign:    order.utmCampaign,
    utmSource:      order.utmSource,
    utmMedium:      order.utmMedium,
  }
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const [selected, setSelected] = useState<OrderDetail | null>(null)

  if (!orders.length) {
    return <p className="text-sm text-gray-400 py-4 text-center">Nenhum pedido registrado ainda</p>
  }

  return (
    <>
      {/* ── Desktop: tabela ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedido</th>
              <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Itens</th>
              <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
              <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => {
              const id = typeof order._id === 'string' ? order._id : order._id.toString()
              const itemLabel = order.items.length === 1
                ? order.items[0].name
                : `${order.items[0].name} +${order.items.length - 1}`
              return (
                <tr
                  key={id}
                  onClick={() => setSelected(toDetail(order))}
                  className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 font-mono text-xs text-gray-500">#{id.slice(-6).toUpperCase()}</td>
                  <td className="py-3 text-gray-700 max-w-[180px] truncate">{itemLabel}</td>
                  <td className="py-3 font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(order.total)}</td>
                  <td className="py-3 text-gray-500 whitespace-nowrap">{formatDatetime(order.createdAt)}</td>
                  <td className="py-3">
                    <Badge variant="purple" className="gap-1 whitespace-nowrap">
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </Badge>
                  </td>
                  <td className="py-3 pl-2">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: cards ── */}
      <div className="md:hidden space-y-2">
        {orders.map((order) => {
          const id = typeof order._id === 'string' ? order._id : order._id.toString()
          return (
            <button
              key={id}
              onClick={() => setSelected(toDetail(order))}
              className="w-full text-left bg-gray-50 hover:bg-purple-50/50 rounded-xl p-3 space-y-2 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-400">#{id.slice(-6).toUpperCase()}</span>
                <div className="flex items-center gap-1">
                  <Badge variant="purple" className="gap-1">
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </Badge>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">
                    {order.items[0]?.name}
                    {order.items.length > 1 && (
                      <span className="text-gray-400 font-normal"> +{order.items.length - 1}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDatetime(order.createdAt)}</p>
                </div>
                <p className="font-bold text-gray-900 shrink-0 text-sm">{formatCurrency(order.total)}</p>
              </div>
            </button>
          )
        })}
      </div>

      <OrderDetailsDrawer order={selected} onClose={() => setSelected(null)} />
    </>
  )
}
