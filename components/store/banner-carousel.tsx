'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Banner {
  _id: string
  title: string
  imageUrl: string
  linkUrl?: string
}

interface BannerCarouselProps {
  banners: Banner[]
}

const INTERVAL_MS = 5500

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const pointerStart = useRef<number | null>(null)

  const goTo = useCallback((idx: number) => {
    setCurrent(idx)
    setProgressKey((k) => k + 1)
  }, [])

  const next = useCallback(() => {
    goTo((current + 1) % banners.length)
  }, [current, banners.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length)
  }, [current, banners.length, goTo])

  useEffect(() => {
    if (banners.length <= 1 || paused) return
    const timer = setInterval(next, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [next, banners.length, paused])

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = e.clientX
  }
  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStart.current === null) return
    const delta = e.clientX - pointerStart.current
    pointerStart.current = null
    if (Math.abs(delta) < 40) return
    if (delta < 0) next(); else prev()
  }

  if (!banners.length) return null

  const banner = banners[current]

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gray-900 aspect-[16/6] md:aspect-[16/5] select-none cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* ─── Slide (cross-fade) ─────────────────────────────────────────── */}
        <AnimatePresence mode="sync">
        <motion.div
          key={banner._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Ken Burns image */}
          <motion.div
            key={`kb-${banner._id}`}
            initial={{ scale: 1, x: 0 }}
            animate={{ scale: 1.08, x: -12 }}
            transition={{ duration: INTERVAL_MS / 1000, ease: 'linear' }}
            className="absolute inset-0 origin-center"
          >
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
              draggable={false}
            />
          </motion.div>

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Text */}
          <div className="absolute inset-0 flex items-end md:items-center p-5 md:p-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="space-y-3 max-w-lg"
            >
              <h2 className="text-white font-bold text-xl md:text-3xl lg:text-4xl leading-tight drop-shadow-lg">
                {banner.title}
              </h2>
              {banner.linkUrl && (
                <Link
                  href={banner.linkUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-gray-900 text-sm font-semibold shadow-lg hover:bg-gray-50 active:scale-95 transition-all duration-150"
                >
                  Ver oferta
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ─── Controls ───────────────────────────────────────────────────── */}
      {banners.length > 1 && (
        <>
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i) }}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === current
                    ? 'w-7 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                )}
                aria-label={`Ir para banner ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          {!paused && (
            <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/10">
              <div
                key={progressKey}
                className="h-full bg-white/70 origin-left"
                style={{ animation: `progress ${INTERVAL_MS}ms linear forwards` }}
              />
            </div>
          )}
        </>
      )}

      {/* Pause indicator */}
      {paused && banners.length > 1 && (
        <div className="absolute top-3 right-3 z-20 flex gap-0.5">
          <span className="w-[3px] h-3.5 rounded-full bg-white/60" />
          <span className="w-[3px] h-3.5 rounded-full bg-white/60" />
        </div>
      )}
    </div>
  )
}
