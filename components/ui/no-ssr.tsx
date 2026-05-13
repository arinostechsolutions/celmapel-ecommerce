'use client'
import { useEffect, useState } from 'react'

/**
 * Renders children only on the client (after hydration).
 * Prevents hooks from react-hook-form / zod from running during SSR prerender.
 */
export function NoSSR({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <>{children}</>
}
