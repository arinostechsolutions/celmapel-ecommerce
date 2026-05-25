import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import ActivityLog from '@/lib/db/models/activity-log'
import { ok, internalError, unauthorized } from '@/lib/api/response'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    requireDashboardAccess(payload)

    await connectDB()

    const { searchParams } = req.nextUrl
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const cursor = searchParams.get('cursor')
    const action = searchParams.get('action')

    const query: Record<string, unknown> = { storeId: DEFAULT_STORE_ID }
    if (cursor) query._id = { $lt: cursor }
    if (action) query.action = action

    const logs = await ActivityLog.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = logs.length > limit
    const items = hasMore ? logs.slice(0, limit) : logs
    const nextCursor = hasMore ? String(items[items.length - 1]._id) : undefined

    return ok({ logs: items, nextCursor, hasMore })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') return unauthorized()
    return internalError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    requireDashboardAccess(payload)

    await connectDB()

    const body = await req.json()
    const log = await ActivityLog.create({
      storeId:  DEFAULT_STORE_ID,
      userId:   payload.sub,
      userName: body.userName ?? 'Sistema',
      action:   body.action,
      entity:   body.entity,
      entityId: body.entityId,
      details:  body.details,
    })

    return ok({ log }, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') return unauthorized()
    return internalError(err)
  }
}
