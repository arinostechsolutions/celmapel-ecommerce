'use client'

import { useCallback } from 'react'
import { useCart } from './use-cart'

type EventType = 'view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_initiated'

export function useTrack() {
  const sessionId = useCart((s) => s.sessionId)

  const track = useCallback(
    (type: EventType, productId: string) => {
      if (!productId) return
      // Fire-and-forget — nunca bloqueia a UI
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, productId, sessionId }),
      }).catch(() => {/* silencioso */})
    },
    [sessionId]
  )

  return { track }
}
