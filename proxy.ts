import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessTokenEdge } from '@/lib/auth/jwt-edge'

const DASHBOARD_PATHS = ['/dashboard']
const PROTECTED_API_PATHS = [
  '/api/products',
  '/api/categories',
  '/api/banners',
  '/api/campaigns',
  '/api/customers',
  '/api/settings',
  '/api/sync',
  '/api/upload',
]

function isDashboard(pathname: string) {
  return DASHBOARD_PATHS.some((p) => pathname.startsWith(p))
}

function isProtectedApi(pathname: string) {
  return PROTECTED_API_PATHS.some((p) => pathname.startsWith(p))
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

  if (isDashboard(pathname) && pathname !== '/dashboard/login') {
    const token = req.cookies.get('access_token')?.value

    if (!token) {
      const loginUrl = new URL('/dashboard/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const payload = await verifyAccessTokenEdge(token)
      if (!['owner', 'manager', 'viewer'].includes(payload.role)) {
        return NextResponse.redirect(new URL('/dashboard/login', req.url))
      }
    } catch {
      const loginUrl = new URL('/dashboard/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (isProtectedApi(pathname)) {
    const requiresAuth =
      req.method !== 'GET' ||
      pathname.startsWith('/api/upload') ||
      pathname.startsWith('/api/sync')

    if (requiresAuth) {
      const authHeader = req.headers.get('authorization')
      const cookieToken = req.cookies.get('access_token')?.value
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

      if (!token) {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } },
          { status: 401 }
        )
      }

      try {
        await verifyAccessTokenEdge(token)
      } catch {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Token inválido ou expirado' } },
          { status: 401 }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/products/:path*',
    '/api/categories/:path*',
    '/api/banners/:path*',
    '/api/campaigns/:path*',
    '/api/customers/:path*',
    '/api/settings/:path*',
    '/api/sync/:path*',
    '/api/upload/:path*',
  ],
}
