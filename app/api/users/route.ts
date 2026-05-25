import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { ok, unauthorized, forbidden, internalError } from '@/lib/api/response'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'

export async function GET(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const { searchParams } = new URL(req.url)
    const rolesParam = searchParams.get('roles')
    const roles = rolesParam ? rolesParam.split(',') : ['owner', 'manager', 'viewer', 'customer']

    await connectDB()

    const users = await User.find({ role: { $in: roles } })
      .select('name email role permissions storeId')
      .sort({ name: 1 })
      .lean()

    return ok({ users })
  } catch (err) {
    return internalError(err)
  }
}
