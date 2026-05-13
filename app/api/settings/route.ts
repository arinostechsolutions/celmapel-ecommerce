import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Store from '@/lib/db/models/store'
import { requireAuth, requireDashboardAccess, requireRole } from '@/lib/api/auth-guard'
import { ok, badRequest, notFound, unauthorized, forbidden, internalError } from '@/lib/api/response'

const UpdateStoreSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (formato HEX)').optional(),
  whatsappPhone: z.string().regex(/^\d{8,11}$/, 'Telefone inválido').optional(),
  whatsappDDI: z.string().regex(/^\d{1,4}$/).optional(),
  whatsappTemplate: z.string().max(1000).optional(),
  address: z.string().max(300).optional(),
  businessHours: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        open: z.string().regex(/^\d{2}:\d{2}$/),
        close: z.string().regex(/^\d{2}:\d{2}$/),
        closed: z.boolean(),
      })
    )
    .optional(),
})

export async function GET(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    await connectDB()
    const store = await Store.findById(payload.storeId).lean()
    if (!store) return notFound('Loja não encontrada')

    return ok(store)
  } catch (err) {
    return internalError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireRole(payload, ['owner', 'manager'])
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const body = await req.json()
    const parsed = UpdateStoreSchema.safeParse(body)

    if (!parsed.success) return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)

    await connectDB()

    const store = await Store.findByIdAndUpdate(
      payload.storeId,
      { $set: parsed.data },
      { new: true }
    )

    if (!store) return notFound('Loja não encontrada')

    return ok(store)
  } catch (err) {
    return internalError(err)
  }
}
