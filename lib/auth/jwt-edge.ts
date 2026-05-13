/**
 * Verificação JWT compatível com Edge Runtime.
 * Usa `jose` (Web Crypto API pura) em vez de `jsonwebtoken`.
 * Importar este arquivo APENAS no middleware.ts.
 */
import { jwtVerify, type JWTPayload } from 'jose'

export interface EdgeJwtPayload extends JWTPayload {
  sub: string
  email: string
  role: string
  storeId?: string
}

function getSecret(raw: string): Uint8Array {
  return new TextEncoder().encode(raw)
}

export async function verifyAccessTokenEdge(token: string): Promise<EdgeJwtPayload> {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não definido')

  const { payload } = await jwtVerify(token, getSecret(secret))
  return payload as EdgeJwtPayload
}
