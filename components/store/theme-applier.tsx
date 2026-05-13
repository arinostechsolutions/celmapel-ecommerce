'use client'

import { useEffect } from 'react'

interface ThemeApplierProps {
  primaryColor: string // e.g. "#9333ea"
}

/**
 * Injeta a cor primária da loja como variável CSS e sobrescreve
 * as classes Tailwind purple para aplicar o tema dinamicamente.
 */
export function ThemeApplier({ primaryColor }: ThemeApplierProps) {
  useEffect(() => {
    if (!primaryColor || !/^#[0-9a-fA-F]{6}$/.test(primaryColor)) return

    // Calcula versão mais clara (hover) e mais escura (active)
    const hex = primaryColor.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)

    const lighten = (v: number, pct: number) => Math.min(255, Math.round(v + (255 - v) * pct))
    const darken  = (v: number, pct: number) => Math.max(0,   Math.round(v * (1 - pct)))
    const toHex   = (v: number) => v.toString(16).padStart(2, '0')

    const light = `#${toHex(lighten(r, 0.88))}${toHex(lighten(g, 0.88))}${toHex(lighten(b, 0.88))}`
    const dark  = `#${toHex(darken(r, 0.12))}${toHex(darken(g, 0.12))}${toHex(darken(b, 0.12))}`

    const id  = 'store-theme'
    let el = document.getElementById(id) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = id
      document.head.appendChild(el)
    }

    el.textContent = `
      :root { --color-primary: ${primaryColor}; --color-primary-light: ${light}; --color-primary-dark: ${dark}; }

      .bg-purple-600   { background-color: ${primaryColor} !important; }
      .bg-purple-700   { background-color: ${dark}         !important; }
      .bg-purple-100   { background-color: ${light}        !important; }
      .bg-purple-50    { background-color: ${light}        !important; }
      .text-purple-600 { color: ${primaryColor}            !important; }
      .text-purple-700 { color: ${dark}                    !important; }
      .border-purple-500 { border-color: ${primaryColor}   !important; }
      .ring-purple-500   { --tw-ring-color: ${primaryColor}!important; }
      .focus\\:border-purple-500:focus { border-color: ${primaryColor} !important; }
      .hover\\:bg-purple-700:hover     { background-color: ${dark}    !important; }
      .hover\\:text-purple-600:hover   { color: ${primaryColor}       !important; }
      .focus-visible\\:ring-purple-500:focus-visible { --tw-ring-color: ${primaryColor} !important; }
    `
  }, [primaryColor])

  return null
}
