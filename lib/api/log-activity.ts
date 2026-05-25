import connectDB from '@/lib/db/mongoose'
import ActivityLog, { type ActivityAction } from '@/lib/db/models/activity-log'

interface LogOptions {
  storeId: string
  userId?: string
  userName: string
  action: ActivityAction
  entity: string
  entityId?: string
  details?: Record<string, unknown>
}

/** Registra uma ação no log de atividades de forma não-bloqueante */
export async function logActivity(opts: LogOptions): Promise<void> {
  try {
    await connectDB()
    await ActivityLog.create({
      storeId:  opts.storeId,
      userId:   opts.userId,
      userName: opts.userName,
      action:   opts.action,
      entity:   opts.entity,
      entityId: opts.entityId,
      details:  opts.details,
    })
  } catch {
    // Log nunca deve quebrar a operação principal
  }
}
