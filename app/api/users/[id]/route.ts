import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { ok, badRequest, notFound, unauthorized, forbidden, internalError } from '@/lib/api/response'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { ALL_PERMISSIONS } from '@/lib/permissions'
import { logActivity } from '@/lib/api/log-activity'

const UpdateUserSchema = z.object({
  role:        z.enum(['owner', 'manager', 'viewer', 'customer']).optional(),
  storeId:     z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

// Roles que cada nível pode atribuir
const ALLOWED_BY_ROLE: Record<string, string[]> = {
  master: ['owner', 'manager', 'viewer', 'customer'],
  owner:  ['owner', 'viewer'],
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const allowedRoles = ALLOWED_BY_ROLE[payload.role]
    if (!allowedRoles) return forbidden()

    const { id } = await params
    const body = await req.json()
    const parsed = UpdateUserSchema.safeParse(body)

    if (!parsed.success) return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)

    if (parsed.data.role && !allowedRoles.includes(parsed.data.role)) return forbidden()

    await connectDB()

    const update: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.role) update.role = parsed.data.role
    if (parsed.data.storeId) update.storeId = parsed.data.storeId
    if (parsed.data.permissions !== undefined) {
      update.permissions = parsed.data.permissions.filter((p) =>
        (ALL_PERMISSIONS as string[]).includes(p)
      )
    }

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select('name email role storeId')
      .lean()

    if (!user) return notFound('Usuário não encontrado')

    const storeId = payload.storeId ?? (user.storeId ? String(user.storeId) : undefined)
    if (storeId) {
      if (parsed.data.role) {
        logActivity({
          storeId,
          userId:   payload.sub,
          userName: payload.email ?? 'sistema',
          action:   'user_role_changed',
          entity:   'user',
          entityId: id,
          details:  { targetUser: user.name, role: parsed.data.role },
        })
      }
      if (parsed.data.permissions !== undefined) {
        logActivity({
          storeId,
          userId:   payload.sub,
          userName: payload.email ?? 'sistema',
          action:   'permissions_updated',
          entity:   'user',
          entityId: id,
          details:  { targetUser: user.name, permissions: update.permissions },
        })
      }
    }

    return ok(user)
  } catch (err) {
    return internalError(err)
  }
}
