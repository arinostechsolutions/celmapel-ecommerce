import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export interface JwtPayload {
  sub: string
  email: string
  role: string
  storeId?: string
  iat?: number
  exp?: number
}

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET não definido')
  return s
}

function getRefreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET
  if (!s) throw new Error('JWT_REFRESH_SECRET não definido')
  return s
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '2h' })
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as JwtPayload
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
