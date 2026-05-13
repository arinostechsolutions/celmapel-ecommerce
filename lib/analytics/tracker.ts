import connectDB from '@/lib/db/mongoose'
import Event from '@/lib/db/models/event'
import Product from '@/lib/db/models/product'
import type { EventDocument } from '@/lib/db/models/event'

export type EventType = 'view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_initiated'

interface TrackEventParams {
  storeId: string
  productId: string
  type: EventType
  userId?: string
  sessionId: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

const productCounterMap: Record<EventType, keyof { viewCount: number; cartCount: number; orderCount: number } | null> = {
  view: 'viewCount',
  add_to_cart: 'cartCount',
  remove_from_cart: null,
  checkout_initiated: 'orderCount',
}

export async function trackEvent(params: TrackEventParams): Promise<EventDocument | null> {
  try {
    await connectDB()

    const event = await Event.create({
      storeId: params.storeId,
      productId: params.productId,
      type: params.type,
      userId: params.userId,
      sessionId: params.sessionId,
      utmSource: params.utmSource,
      utmMedium: params.utmMedium,
      utmCampaign: params.utmCampaign,
    })

    const counter = productCounterMap[params.type]
    if (counter) {
      await Product.findByIdAndUpdate(params.productId, { $inc: { [counter]: 1 } })
    }

    return event
  } catch {
    // Tracking nunca deve quebrar o fluxo principal
    return null
  }
}

export async function getTopProducts(
  storeId: string,
  type: EventType,
  limit = 10,
  since?: Date
): Promise<Array<{ productId: string; count: number }>> {
  await connectDB()

  const match: Record<string, unknown> = { storeId, type }
  if (since) match.createdAt = { $gte: since }

  return Event.aggregate([
    { $match: match },
    { $group: { _id: '$productId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { productId: '$_id', count: 1, _id: 0 } },
  ])
}
