import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product'
import { sanitizeHtml } from '@/lib/security/sanitize'
import { ok, badRequest, internalError, unauthorized, forbidden } from '@/lib/api/response'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { checkRateLimit } from '@/lib/security/rate-limit'
import slugify from 'slugify'
import { mongoIdSchema } from '@/lib/security/validate'

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(5000).optional().default(''),
  price: z.number().positive(),
  promoPrice: z.number().positive().optional(),
  sku: z.string().max(100).optional(),
  categoryId: mongoIdSchema,
  tags: z.array(z.string().max(50)).max(10).default([]),
  variations: z
    .array(z.object({ name: z.string(), options: z.array(z.string()) }))
    .max(5)
    .default([]),
  status: z.enum(['published', 'draft', 'inactive']).default('draft'),
  showOnSite: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  images: z
    .array(z.object({ url: z.string().url(), publicId: z.string(), alt: z.string().optional(), order: z.number() }))
    .default([]),
})

// GET — listagem pública (catálogo) ou admin (dashboard)
export async function GET(req: NextRequest) {
  const rateLimitRes = await checkRateLimit(req, 'search')
  if (rateLimitRes) return rateLimitRes

  try {
    await connectDB()

    const { searchParams } = req.nextUrl
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('q')
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
    const sort = searchParams.get('sort') ?? 'createdAt'
    const order = searchParams.get('order') === 'asc' ? 1 : -1
    const isDashboard = searchParams.get('dashboard') === 'true'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    const storeId = searchParams.get('storeId') ?? process.env.DEFAULT_STORE_ID

    const query: Record<string, unknown> = {
      storeId,
      isDeleted: false,
    }

    if (!isDashboard) {
      query.status = 'published'
      query.showOnSite = true
    }

    if (categoryId) query.categoryId = categoryId
    if (minPrice || maxPrice) {
      query.price = {
        ...(minPrice ? { $gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { $lte: parseFloat(maxPrice) } : {}),
      }
    }

    if (search) {
      query.$text = { $search: search }
    }

    if (cursor) {
      query._id = { $lt: cursor }
    }

    const products = await Product.find(query)
      .sort({ [sort]: order, _id: -1 })
      .limit(limit + 1)
      .populate('categoryId', 'name slug')
      .lean()

    const hasMore = products.length > limit
    const items = hasMore ? products.slice(0, limit) : products
    const nextCursor = hasMore ? String(items[items.length - 1]._id) : undefined

    return ok({ products: items, nextCursor, hasMore })
  } catch (err) {
    return internalError(err)
  }
}

// POST — criar produto (dashboard)
export async function POST(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      const msg = (e as Error).message
      return msg === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const body = await req.json()
    const parsed = CreateProductSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)
    }

    const data = parsed.data
    data.description = sanitizeHtml(data.description ?? '')

    await connectDB()

    const baseSlug = slugify(data.name, { lower: true, strict: true })
    const slugExists = await Product.findOne({ slug: baseSlug, storeId: payload.storeId, isDeleted: false })
    const slug = slugExists ? `${baseSlug}-${Date.now()}` : baseSlug

    const product = await Product.create({
      ...data,
      slug,
      storeId: payload.storeId,
    })

    return ok(product, 201)
  } catch (err) {
    return internalError(err)
  }
}
