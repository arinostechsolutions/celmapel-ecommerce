'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'

// ── Lightbox modal ────────────────────────────────────────────────────────────

interface ImageLightboxProps {
  src: string | null
  alt?: string
  onClose: () => void
}

export function ImageLightbox({ src, alt = '', onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [src, onClose])

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            exit={{ scale: 0.88,    opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-2xl aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain rounded-2xl"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </motion.div>

          <p className="absolute bottom-4 inset-x-0 text-center text-white/40 text-xs pointer-events-none">
            Esc ou clique fora para fechar
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Trigger wrapper ───────────────────────────────────────────────────────────

interface LightboxTriggerProps {
  src: string
  alt?: string
  children: React.ReactNode
  className?: string
}

export function LightboxTrigger({ src, alt, children, className }: LightboxTriggerProps) {
  const open = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('lightbox:open', { detail: { src, alt } }))
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={`Ampliar imagem${alt ? ` de ${alt}` : ''}`}
      className={`relative cursor-zoom-in group/lb block ${className ?? ''}`}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(e) }}
    >
      {children}
      {/* Ícone zoom no hover */}
      <span className="absolute inset-0 rounded-[inherit] flex items-center justify-center opacity-0 group-hover/lb:opacity-100 transition-opacity duration-200 bg-black/10 pointer-events-none">
        <span className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <ZoomIn className="w-4 h-4 text-white" />
        </span>
      </span>
    </span>
  )
}

// ── Provider global ───────────────────────────────────────────────────────────

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ src: string; alt?: string } | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      setState((e as CustomEvent<{ src: string; alt?: string }>).detail)
    }
    window.addEventListener('lightbox:open', handler)
    return () => window.removeEventListener('lightbox:open', handler)
  }, [])

  return (
    <>
      {children}
      <ImageLightbox src={state?.src ?? null} alt={state?.alt} onClose={() => setState(null)} />
    </>
  )
}
