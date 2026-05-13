import { NextRequest } from 'next/server'
import { z } from 'zod'
import { destroyCloudinaryAsset } from '@/lib/cloudinary/sign'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { ok, badRequest, unauthorized, forbidden, internalError } from '@/lib/api/response'

const DeleteSchema = z.object({
  publicId: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
      void payload
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const body = await req.json()
    const parsed = DeleteSchema.safeParse(body)

    if (!parsed.success) return badRequest('publicId inválido')

    const success = await destroyCloudinaryAsset(parsed.data.publicId)
    return ok({ deleted: success })
  } catch (err) {
    return internalError(err)
  }
}
