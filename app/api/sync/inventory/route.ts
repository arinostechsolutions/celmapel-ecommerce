import { NextRequest } from 'next/server'
import { syncInventory } from '@/lib/sync/inventory'
import { requireAuth, requireRole } from '@/lib/api/auth-guard'
import { ok, unauthorized, forbidden, internalError } from '@/lib/api/response'

export async function POST(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireRole(payload, ['owner'])
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    if (!payload.storeId) return forbidden('Sem loja associada')

    const logId = await syncInventory(payload.storeId, 'manual')
    return ok({ logId, message: 'Sincronização iniciada' })
  } catch (err) {
    return internalError(err)
  }
}
