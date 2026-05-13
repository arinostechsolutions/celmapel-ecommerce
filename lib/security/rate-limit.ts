import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '@/lib/cache/redis'
import { NextRequest, NextResponse } from 'next/server'

let authLimiter: Ratelimit | null = null
let searchLimiter: Ratelimit | null = null
let trackLimiter: Ratelimit | null = null
let dashboardLimiter: Ratelimit | null = null

function getAuthLimiter(): Ratelimit {
  if (!authLimiter) {
    authLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      prefix: 'rl:auth',
    })
  }
  return authLimiter
}

function getSearchLimiter(): Ratelimit {
  if (!searchLimiter) {
    searchLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      prefix: 'rl:search',
    })
  }
  return searchLimiter
}

function getTrackLimiter(): Ratelimit {
  if (!trackLimiter) {
    trackLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(60, '60 s'),
      prefix: 'rl:track',
    })
  }
  return trackLimiter
}

function getDashboardLimiter(): Ratelimit {
  if (!dashboardLimiter) {
    dashboardLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, '60 s'),
      prefix: 'rl:dashboard',
    })
  }
  return dashboardLimiter
}

export type RateLimitType = 'auth' | 'search' | 'track' | 'dashboard'

export async function checkRateLimit(
  req: NextRequest,
  type: RateLimitType,
  identifier?: string
): Promise<NextResponse | null> {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'

    const key = identifier ?? ip

    let result: Awaited<ReturnType<Ratelimit['limit']>>

    switch (type) {
      case 'auth':
        result = await getAuthLimiter().limit(key)
        break
      case 'search':
        result = await getSearchLimiter().limit(key)
        break
      case 'track':
        result = await getTrackLimiter().limit(key)
        break
      case 'dashboard':
        result = await getDashboardLimiter().limit(key)
        break
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Muitas requisições. Tente novamente em breve.',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.reset),
          },
        }
      )
    }

    return null
  } catch {
    // Se o Redis não estiver disponível, não bloqueamos a requisição
    return null
  }
}
