import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Cart from '@/lib/db/models/cart'
import Product from '@/lib/db/models/product'
import Coupon from '@/lib/db/models/coupon'
import { ok, badRequest, notFound, internalError } from '@/lib/api/response'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { mongoIdSchema } from '@/lib/security/validate'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

function getCartIdentity(req: NextRequest): { userId?: string; sessionId?: string } {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies.get('access_token')?.value
  if (token) {
    try {
      const payload = verifyAccessToken(token)
      return { userId: payload.sub }
    } catch { /* continua como anônimo */ }
  }

  const sessionId = req.cookies.get('session_id')?.value
  return { sessionId: sessionId ?? 'anonymous' }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const identity = getCartIdentity(req)

    const cart = await Cart.findOne({
      ...identity,
      storeId: DEFAULT_STORE_ID,
    }).populate('couponId').lean()

    return ok(cart ?? { items: [], total: 0, discountAmount: 0 })
  } catch (err) {
    return internalError(err)
  }
}

const AddItemSchema = z.object({
  productId: mongoIdSchema,
  quantity: z.number().int().positive().max(99),
  selectedVariations: z.record(z.string(), z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body.action as string

    if (action === 'apply_coupon') {
      return applyCoupon(req, String(body.code ?? ''))
    }

    const parsed = AddItemSchema.safeParse(body)
    if (!parsed.success) return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)

    await connectDB()

    const product = await Product.findOne({
      _id: parsed.data.productId,
      storeId: DEFAULT_STORE_ID,
      isDeleted: false,
      status: 'published',
      showOnSite: true,
    }).lean()

    if (!product) return notFound('Produto não encontrado ou indisponível')

    const identity = getCartIdentity(req)
    const price = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price

    let cart = await Cart.findOne({ ...identity, storeId: DEFAULT_STORE_ID })

    if (!cart) {
      cart = await Cart.create({
        ...identity,
        storeId: DEFAULT_STORE_ID,
        items: [],
        discountAmount: 0,
        total: 0,
      })
    }

    const existingIndex = cart.items.findIndex(
      (i: { productId: { toString: () => string } }) => i.productId.toString() === parsed.data.productId
    )

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += parsed.data.quantity
    } else {
      cart.items.push({
        productId: parsed.data.productId as unknown as import('mongoose').Types.ObjectId,
        name: product.name,
        price,
        quantity: parsed.data.quantity,
        imageUrl: product.images[0]?.url,
        selectedVariations: parsed.data.selectedVariations as Record<string, string> | undefined,
      })
    }

    cart.total = cart.items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    )

    await cart.save()
    return ok(cart)
  } catch (err) {
    return internalError(err)
  }
}

async function applyCoupon(req: NextRequest, code: string) {
  try {
    if (!code) return badRequest('Código do cupom obrigatório')

    await connectDB()
    const identity = getCartIdentity(req)

    const cart = await Cart.findOne({ ...identity, storeId: DEFAULT_STORE_ID })
    if (!cart) return notFound('Carrinho não encontrado')

    const coupon = await Coupon.findOne({
      storeId: DEFAULT_STORE_ID,
      code: code.toUpperCase().trim(),
      isActive: true,
      validUntil: { $gte: new Date() },
    })

    if (!coupon) return notFound('Cupom inválido ou expirado')
    if (coupon.usedCount >= coupon.maxUses) return badRequest('Cupom esgotado')
    if (coupon.minOrderValue && cart.total < coupon.minOrderValue) {
      return badRequest(`Valor mínimo para este cupom: R$ ${coupon.minOrderValue.toFixed(2)}`)
    }

    const subtotal = cart.items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    )

    const discount =
      coupon.type === 'percentage'
        ? subtotal * (coupon.value / 100)
        : Math.min(coupon.value, subtotal)

    cart.couponId = coupon._id
    cart.discountAmount = discount
    cart.total = Math.max(0, subtotal - discount)
    await cart.save()

    return ok(cart)
  } catch (err) {
    return internalError(err)
  }
}
