import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product'
import { sanitizeHtml } from '@/lib/security/sanitize'
import { ok, badRequest, notFound, internalError, unauthorized, forbidden } from '@/lib/api/response'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { destroyCloudinaryAsset } from '@/lib/cloudinary/sign'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await connectDB()

    const product = await Product.findOne({
      $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : null }, { slug: id }],
      isDeleted: false,
    }).populate('categoryId', 'name slug')

    if (!product) return notFound('Produto não encontrado')

    return ok(product)
  } catch (err) {
    return internalError(err)
  }
}

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(5000).optional(),
  price: z.number().positive().optional(),
  promoPrice: z.number().positive().nullable().optional(),
  sku: z.string().max(100).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  variations: z.array(z.object({ name: z.string(), options: z.array(z.string()) })).optional(),
  status: z.enum(['published', 'draft', 'inactive']).optional(),
  showOnSite: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(z.object({
    url:       z.string().url(),
    publicId:  z.string(),
    alt:       z.string().optional(),
    order:     z.number().optional().default(0),
    isPrimary: z.boolean().optional(),
  })).optional(),
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

    const data = { ...parsed.data }
    if (data.description) data.description = sanitizeHtml(data.description)

    // storeId pode não estar no JWT (admins criados antes do campo existir)
    const storeId = payload.storeId ?? process.env.DEFAULT_STORE_ID

    await connectDB()

    // Busca produto atual para detectar imagens removidas/substituídas
    const current = await Product.findOne({ _id: id, storeId, isDeleted: false })
    if (!current) return notFound('Produto não encontrado')

    // Se veio um novo array de imagens, deleta do Cloudinary as que foram removidas
    if (data.images) {
      const newPublicIds = new Set(data.images.map((img) => img.publicId).filter(Boolean))
      for (const oldImg of current.images as Array<{ publicId?: string }>) {
        if (
          oldImg.publicId &&
          !newPublicIds.has(oldImg.publicId) &&
          !oldImg.publicId.startsWith('external_')
        ) {
          try { await destroyCloudinaryAsset(oldImg.publicId) } catch { /* silencioso */ }
        }
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, storeId, isDeleted: false },
      { $set: data },
      { new: true }
    )

    if (!product) return notFound('Produto não encontrado')
    return ok(product)
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

    const product = await Product.findOne({ _id: id, storeId, isDeleted: false })
    if (!product) return notFound('Produto não encontrado')

    // Deletar imagens do Cloudinary
    for (const img of product.images) {
      if (img.publicId && !img.publicId.startsWith('external_')) {
        try {
          await destroyCloudinaryAsset(img.publicId)
        } catch {
          // Log silencioso — não bloquear a deleção
        }
      }
    }

    await Product.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      showOnSite: false,
      status: 'inactive',
    })

    return ok({ message: 'Produto removido' })
  } catch (err) {
    return internalError(err)
  }
}
