import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Order from '@/lib/db/models/order'
import Event from '@/lib/db/models/event'
import Product from '@/lib/db/models/product'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { ok, unauthorized, forbidden, internalError } from '@/lib/api/response'
import { subDays, startOfDay } from 'date-fns'

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

    const storeId = payload.storeId
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = subDays(todayStart, 7)
    const monthStart = subDays(todayStart, 30)

    const [
      ordersToday,
      ordersWeek,
      ordersMonth,
      topViewed,
      topAddedToCart,
      recentOrders,
      ordersByDay,
    ] = await Promise.all([
      Order.countDocuments({ storeId, createdAt: { $gte: todayStart } }),
      Order.countDocuments({ storeId, createdAt: { $gte: weekStart } }),
      Order.countDocuments({ storeId, createdAt: { $gte: monthStart } }),

      Event.aggregate([
        { $match: { storeId, type: 'view', createdAt: { $gte: monthStart } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', count: 1, _id: 0 } },
      ]),

      Event.aggregate([
        { $match: { storeId, type: 'add_to_cart', createdAt: { $gte: monthStart } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', count: 1, _id: 0 } },
      ]),

      Order.find({ storeId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      Order.aggregate([
        { $match: { storeId, createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ])

    const totalViews = await Event.countDocuments({ storeId, type: 'view', createdAt: { $gte: monthStart } })
    const totalCheckouts = await Order.countDocuments({ storeId, createdAt: { $gte: monthStart } })
    const conversionRate = totalViews > 0 ? ((totalCheckouts / totalViews) * 100).toFixed(2) : '0.00'

    return ok({
      orders: { today: ordersToday, week: ordersWeek, month: ordersMonth },
      topViewed,
      topAddedToCart,
      recentOrders,
      ordersByDay,
      conversionRate,
    })
  } catch (err) {
    return internalError(err)
  }
}
