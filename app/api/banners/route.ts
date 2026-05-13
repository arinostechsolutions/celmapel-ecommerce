import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Banner from '@/lib/db/models/banner'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { ok, badRequest, unauthorized, forbidden, internalError } from '@/lib/api/response'

const CreateBannerSchema = z.object({
  title:               z.string().min(1).max(200).trim(),
  imageUrl:            z.string().url(),
  imagePublicId:       z.string().min(1),
  imageMobileUrl:      z.string().url().optional().or(z.literal('')),
  imageMobilePublicId: z.string().optional(),
  linkUrl:             z.union([z.string().url(), z.string().startsWith('/'), z.literal('')]).optional(),
  startDate:           z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate:             z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  order:               z.number().int().min(0).optional().default(0),
})

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = req.nextUrl
    const storeId = searchParams.get('storeId') ?? process.env.DEFAULT_STORE_ID
    const now = new Date()

    const banners = await Banner.find({
      storeId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ order: 1 })
      .lean()

    return ok(banners)
  } catch (err) {
    return internalError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const body = await req.json()
    const parsed = CreateBannerSchema.safeParse(body)
    if (!parsed.success) return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)

    await connectDB()
    const banner = await Banner.create({ ...parsed.data, storeId: payload.storeId, isActive: true })
    return ok(banner, 201)
  } catch (err) {
    return internalError(err)
  }
}
