'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface AutoRefreshProps {
  /** Intervalo em segundos (padrão: 30) */
  intervalSecs?: number
}

export function AutoRefresh({ intervalSecs = 30 }: AutoRefreshProps) {
  const router = useRouter()
  const [remaining, setRemaining] = useState(intervalSecs)
  const [refreshing, setRefreshing] = useState(false)
  const start = useRef(Date.now())

  const doRefresh = () => {
    setRefreshing(true)
    router.refresh()
    start.current = Date.now()
    setRemaining(intervalSecs)
    setTimeout(() => setRefreshing(false), 800)
  }

  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start.current) / 1000)
      const left = intervalSecs - elapsed
      if (left <= 0) {
        doRefresh()
      } else {
        setRemaining(left)
      }
    }, 1000)
    return () => clearInterval(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalSecs])

  return (
    <button
      onClick={doRefresh}
      title="Atualizar agora"
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors tabular-nums"
    >
      <RefreshCw
        className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`}
      />
      <span>atualiza em {remaining}s</span>
    </button>
  )
}
