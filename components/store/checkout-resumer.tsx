'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'

/**
 * Detecta `?resume_checkout=1` na URL após retorno do login
 * e reabre automaticamente o checkout para o usuário.
 */
export function CheckoutResumer() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()
  const { items, openCheckout } = useCart()

  useEffect(() => {
    if (searchParams?.get('resume_checkout') !== '1') return
    if (items.length === 0) return

    // Remove o param da URL sem recarregar
    const params = new URLSearchParams((searchParams?.toString() ?? ""))
    params.delete('resume_checkout')
    const basePath = pathname ?? '/'
    const clean = params.size > 0 ? `${basePath}?${params}` : basePath
    router.replace(clean, { scroll: false })

    // Pequeno delay para o DOM montar antes de abrir
    const t = setTimeout(() => openCheckout(), 300)
    return () => clearTimeout(t)
  }, [searchParams, items.length, openCheckout, pathname, router])

  return null
}
