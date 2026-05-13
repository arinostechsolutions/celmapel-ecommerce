import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Category from '@/lib/db/models/category'
import { ok, badRequest, internalError, unauthorized, forbidden } from '@/lib/api/response'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import slugify from 'slugify'

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  icon: z.string().default('Tag'),
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = req.nextUrl
    const storeId = searchParams.get('storeId') ?? process.env.DEFAULT_STORE_ID
    const showHidden = searchParams.get('showHidden') === 'true'

    const query: Record<string, unknown> = { storeId, isDeleted: false }
    if (!showHidden) query.isVisible = true

    const categories = await Category.find(query).sort({ order: 1, name: 1 }).lean()

    return ok(categories)
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
    const parsed = CreateCategorySchema.safeParse(body)

    if (!parsed.success) return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)

    await connectDB()

    const slug = slugify(parsed.data.name, { lower: true, strict: true })

    const category = await Category.create({
      ...parsed.data,
      slug,
      storeId: payload.storeId,
    })

    return ok(category, 201)
  } catch (err) {
    return internalError(err)
  }
}
