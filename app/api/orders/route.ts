import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Order from '@/lib/db/models/order'
import Store from '@/lib/db/models/store'
import Coupon from '@/lib/db/models/coupon'
import { ok, badRequest, notFound, internalError } from '@/lib/api/response'
import { verifyAccessToken } from '@/lib/auth/jwt'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

function buildWhatsAppMessage(
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  discount: number,
  couponCode?: string,
  template?: string
): string {
  const itemsList = items
    .map((i) => `• ${i.quantity}x ${i.name} — R$ ${(i.price * i.quantity).toFixed(2).replace('.', ',')}`)
    .join('\n')

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const couponLine = couponCode && discount > 0
    ? `Cupom ${couponCode}: -R$ ${discount.toFixed(2).replace('.', ',')}\n`
    : ''

  if (template) {
    return template
      .replace('{itens}', itemsList)
      .replace('{subtotal}', `R$ ${subtotal.toFixed(2).replace('.', ',')}`)
      .replace('{total}', `R$ ${total.toFixed(2).replace('.', ',')}`)
      .replace('{cupom}', couponLine)
  }

  return `Olá! Gostaria de fazer o seguinte pedido:\n\n${itemsList}\n\n${couponLine}*Total: R$ ${total.toFixed(2).replace('.', ',')}*\n\nAguardo confirmação!`
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const rawToken =
      req.cookies.get('access_token')?.value ??
      req.headers.get('authorization')?.replace('Bearer ', '')

    let userId: string | undefined
    if (rawToken) {
      try { userId = verifyAccessToken(rawToken).sub } catch { /* anônimo */ }
    }

    const body = await req.json().catch(() => ({}))

    // Itens vêm do cliente (Zustand) — o carrinho é gerenciado localmente
    const clientItems = body.items as Array<{
      productId: string; name: string; price: number; quantity: number; imageUrl?: string
    }> | undefined

    if (!clientItems || clientItems.length === 0) {
      return badRequest('Carrinho vazio')
    }

    const store = await Store.findById(DEFAULT_STORE_ID)
    if (!store) return notFound('Loja não encontrada')

    const utmSource   = body.utmSource   as string | undefined
    const utmMedium   = body.utmMedium   as string | undefined
    const utmCampaign = body.utmCampaign as string | undefined
    const couponCode  = body.couponCode  as string | undefined
    const discountAmount = Number(body.discountAmount ?? 0)

    const subtotal = clientItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const total    = Math.max(0, subtotal - discountAmount)

    // Valida cupom se informado
    let couponId: string | undefined
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, storeId: DEFAULT_STORE_ID })
      if (coupon) {
        couponId = String(coupon._id)
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })
      }
    }

    const message = buildWhatsAppMessage(clientItems, total, discountAmount, couponCode, store.whatsappTemplate)

    const phone = `${store.whatsappDDI}${store.whatsappPhone.replace(/\D/g, '')}`
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    const sessionId = req.cookies.get('session_id')?.value ?? 'anonymous'
    const order = await Order.create({
      storeId: DEFAULT_STORE_ID,
      userId,
      sessionId,
      items: clientItems,
      subtotal,
      discountAmount,
      total,
      couponId,
      status: 'initiated_whatsapp',
      whatsappUrl,
      utmSource,
      utmMedium,
      utmCampaign,
    })

    return ok({ order: { id: String(order._id), whatsappUrl }, whatsappUrl }, 201)
  } catch (err) {
    return internalError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = req.nextUrl
    const storeId = searchParams.get('storeId') ?? DEFAULT_STORE_ID
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
    const cursor = searchParams.get('cursor')

    const query: Record<string, unknown> = { storeId }
    if (cursor) query._id = { $lt: cursor }

    const orders = await Order.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = orders.length > limit
    const items = hasMore ? orders.slice(0, limit) : orders
    const nextCursor = hasMore ? String(items[items.length - 1]._id) : undefined

    return ok({ orders: items, nextCursor, hasMore })
  } catch (err) {
    return internalError(err)
  }
}
