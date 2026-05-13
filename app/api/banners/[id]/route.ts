import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Banner from '@/lib/db/models/banner'
import { destroyCloudinaryAsset } from '@/lib/cloudinary/sign'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { ok, badRequest, notFound, unauthorized, forbidden, internalError } from '@/lib/api/response'

type Params = { params: Promise<{ id: string }> }

const UpdateSchema = z.object({
  title:          z.string().min(1).max(200).trim().optional(),
  imageUrl:       z.string().url().optional(),
  imagePublicId:  z.string().optional(),
  linkUrl:        z.union([z.string().url(), z.string().startsWith('/'), z.literal('')]).optional(),
  isActive:       z.boolean().optional(),
  order:          z.number().int().optional(),
  startDate:      z.string().optional(),
  endDate:        z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const { id } = await params
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)

    const storeId = payload.storeId ?? process.env.DEFAULT_STORE_ID
    await connectDB()

    // Busca o banner atual para comparar o publicId antes de sobrescrever
    const current = await Banner.findOne({ _id: id, storeId })
    if (!current) return notFound('Banner não encontrado')

    const incomingPublicId = parsed.data.imagePublicId
    const oldPublicId      = current.imagePublicId as string | undefined

    // Se veio um novo publicId diferente do atual, deleta o antigo do Cloudinary
    if (
      oldPublicId &&
      incomingPublicId !== undefined &&
      incomingPublicId !== oldPublicId &&
      !oldPublicId.startsWith('external_')
    ) {
      try { await destroyCloudinaryAsset(oldPublicId) } catch { /* silencioso */ }
    }

    const banner = await Banner.findOneAndUpdate(
      { _id: id, storeId },
      { $set: parsed.data },
      { new: true }
    )
    return ok(banner)
  } catch (err) {
    return internalError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const { id } = await params
    const storeId = payload.storeId ?? process.env.DEFAULT_STORE_ID
    await connectDB()
    const banner = await Banner.findOne({ _id: id, storeId })
    if (!banner) return notFound('Banner não encontrado')

    if (banner.imagePublicId && !banner.imagePublicId.startsWith('banners/manual_') && !banner.imagePublicId.startsWith('external_')) {
      try {
        await destroyCloudinaryAsset(banner.imagePublicId)
      } catch { /* log silencioso */ }
    }

    await Banner.findOneAndDelete({ _id: id, storeId })
    return ok({ message: 'Banner removido' })
  } catch (err) {
    return internalError(err)
  }
}
