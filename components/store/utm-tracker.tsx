'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const DEBOUNCE_MS = 60 * 60 * 1000 // 1 hora

export function UtmTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const utmCampaign = searchParams?.get('utm_campaign')
    const utmSource   = searchParams?.get('utm_source')
    const utmMedium   = searchParams?.get('utm_medium')

    if (!utmCampaign) return

    // Debounce: não conta mais de 1 clique por hora por campanha
    const key      = `utm_ts_${utmCampaign}`
    const lastStr  = localStorage.getItem(key)
    const now      = Date.now()
    if (lastStr && now - parseInt(lastStr, 10) < DEBOUNCE_MS) return
    localStorage.setItem(key, String(now))

    fetch('/api/campaigns/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utmCampaign, utmSource, utmMedium }),
    }).catch(() => {})
  }, [searchParams])

  return null
}
