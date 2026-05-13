import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Category from '@/lib/db/models/category'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { ok, badRequest, notFound, unauthorized, forbidden, internalError } from '@/lib/api/response'

type Params = { params: Promise<{ id: string }> }

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
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

    await connectDB()
    const cat = await Category.findOneAndUpdate(
      { _id: id, storeId: payload.storeId, isDeleted: false },
      { $set: parsed.data },
      { new: true }
    )
    if (!cat) return notFound('Categoria não encontrada')
    return ok(cat)
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
    await connectDB()
    const cat = await Category.findOneAndUpdate(
      { _id: id, storeId: payload.storeId, isDeleted: false },
      { isDeleted: true, isVisible: false }
    )
    if (!cat) return notFound('Categoria não encontrada')
    return ok({ message: 'Categoria removida' })
  } catch (err) {
    return internalError(err)
  }
}
