'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
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
  const [current,      setCurrent]      = useState(0)
  const [direction,    setDirection]    = useState<'next' | 'prev'>('next')
  const [transitioning, setTransitioning] = useState(false)
  const [paused,       setPaused]       = useState(false)
  const [progressKey,  setProgressKey]  = useState(0)

  // Swipe detection
  const pointerStart = useRef<number | null>(null)

  const goTo = useCallback((idx: number, dir: 'next' | 'prev') => {
    if (transitioning) return
    setDirection(dir)
    setTransitioning(true)
    setCurrent(idx)
    setProgressKey((k) => k + 1)
    setTimeout(() => setTransitioning(false), 550)
  }, [transitioning])

  const next = useCallback(() => {
    goTo((current + 1) % banners.length, 'next')
  }, [current, banners.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length, 'prev')
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

  // Slide content entry transforms based on direction
  const slideEnterFrom = direction === 'next' ? 'translate-x-full' : '-translate-x-full'

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gray-900 aspect-[16/6] md:aspect-[16/5] select-none cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* ─── Slides ──────────────────────────────────────────────────── */}
      {banners.map((banner, i) => {
        const isActive   = i === current
        const isExiting  = !isActive && transitioning

        return (
          <div
            key={banner._id}
            className={cn(
              'absolute inset-0 transition-transform duration-500 ease-in-out will-change-transform',
              isActive
                ? 'translate-x-0 z-10'
                : isExiting
                  ? direction === 'next'
                    ? '-translate-x-full z-10'
                    : 'translate-x-full z-10'
                  : i < current
                    ? '-translate-x-full z-0'
                    : 'translate-x-full z-0'
            )}
            style={
              // Snap entering slide into place before transition
              isActive && transitioning
                ? { transform: `translateX(0)`, transition: 'transform 0.5s ease-in-out' }
                : undefined
            }
          >
            {/* Ken Burns image */}
            <div
              key={`img-${banner._id}-${isActive ? 'active' : 'idle'}`}
              className={cn(
                'absolute inset-0 origin-center',
                isActive && 'animate-ken-burns'
              )}
            >
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
                draggable={false}
              />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Text content */}
            {isActive && (
              <div className="absolute inset-0 flex items-end md:items-center p-5 md:p-10">
                <div
                  key={`content-${current}`}
                  className="animate-content-fade-up space-y-3 max-w-lg"
                  style={{ animationDelay: '100ms', animationFillMode: 'both' }}
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
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* ─── Controls ─────────────────────────────────────────────────── */}
      {banners.length > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-lg"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-lg"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i, i > current ? 'next' : 'prev') }}
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
                style={{
                  animation: `progress ${INTERVAL_MS}ms linear forwards`,
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Paused indicator */}
      {paused && banners.length > 1 && (
        <div className="absolute top-3 right-3 z-20 flex gap-0.5">
          <span className="w-[3px] h-3.5 rounded-full bg-white/60" />
          <span className="w-[3px] h-3.5 rounded-full bg-white/60" />
        </div>
      )}
    </div>
  )
}
