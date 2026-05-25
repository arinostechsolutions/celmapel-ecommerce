import { NextRequest } from 'next/server'
import { verifyAccessToken, type JwtPayload } from '@/lib/auth/jwt'

/** Extrai token do cookie ou do header Authorization */
function extractToken(req: NextRequest): string | null {
  const cookie = req.cookies.get('access_token')?.value
  if (cookie) return cookie

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)

  return null
}

export function requireAuth(req: NextRequest): JwtPayload {
  const token = extractToken(req)
  if (!token) throw new Error('UNAUTHORIZED')

  try {
    return verifyAccessToken(token)
  } catch {
    throw new Error('UNAUTHORIZED')
  }
}

export function requireRole(payload: JwtPayload, roles: string[]): void {
  if (!roles.includes(payload.role)) throw new Error('FORBIDDEN')
}

export function requireDashboardAccess(payload: JwtPayload): void {
  requireRole(payload, ['master', 'owner', 'manager', 'viewer'])
}

export function requireMasterAccess(payload: JwtPayload): void {
  requireRole(payload, ['master'])
}
