'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ICartItem } from '@/types'

interface CartState {
  items: ICartItem[]
  couponCode?: string
  discountAmount: number
  sessionId: string
  isMiniCartOpen: boolean
  isCheckoutOpen: boolean

  addItem: (item: ICartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setDiscount: (code: string, amount: number) => void
  openMiniCart: () => void
  closeMiniCart: () => void
  openCheckout: () => void
  closeCheckout: () => void
}

function generateSessionId() {
  return typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: undefined,
      discountAmount: 0,
      sessionId: generateSessionId(),
      isMiniCartOpen: false,
      isCheckoutOpen: false,

      addItem: (newItem: ICartItem) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === newItem.productId)
          return {
            items: existing
              ? state.items.map((i) =>
                  i.productId === newItem.productId
                    ? { ...i, quantity: i.quantity + newItem.quantity }
                    : i
                )
              : [...state.items, newItem],
          }
        })
      },

      removeItem: (productId: string) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) { get().removeItem(productId); return }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], couponCode: undefined, discountAmount: 0 }),
      setDiscount: (code: string, amount: number) => set({ couponCode: code, discountAmount: amount }),
      openMiniCart: () => set({ isMiniCartOpen: true }),
      closeMiniCart: () => set({ isMiniCartOpen: false }),
      openCheckout: () => set({ isMiniCartOpen: false, isCheckoutOpen: true }),
      closeCheckout: () => set({ isCheckoutOpen: false }),
    }),
    {
      name: 'selmapel-cart',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount,
        sessionId: state.sessionId,
      }),
    }
  )
)

/** Valores derivados de items — sempre reativos */
export function useCartTotals() {
  const items = useCart((s) => s.items)
  const discountAmount = useCart((s) => s.discountAmount)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = Math.max(0, subtotal - discountAmount)
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  return { subtotal, total, itemCount }
}
