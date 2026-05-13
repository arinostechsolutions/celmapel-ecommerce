import { NextRequest } from 'next/server'
import { z } from 'zod'
import { trackEvent, type EventType } from '@/lib/analytics/tracker'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { extractToken, getAuthHeader } from '@/lib/api/auth-guard'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { ok, badRequest, internalError } from '@/lib/api/response'
import { mongoIdSchema } from '@/lib/security/validate'

const EventSchema = z.object({
  productId: mongoIdSchema,
  type: z.enum(['view', 'add_to_cart', 'remove_from_cart', 'checkout_initiated']),
  sessionId: z.string().min(1).max(100),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
})

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

export async function POST(req: NextRequest) {
  const rateLimitRes = await checkRateLimit(req, 'track')
  if (rateLimitRes) return rateLimitRes

  try {
    const body = await req.json()
    const parsed = EventSchema.safeParse(body)

    if (!parsed.success) return badRequest('Dados inválidos')

    const token = extractToken(getAuthHeader(req))
    let userId: string | undefined
    if (token) {
      try {
        const payload = verifyAccessToken(token)
        userId = payload.sub
      } catch { /* anônimo */ }
    }

    await trackEvent({
      storeId: DEFAULT_STORE_ID,
      productId: parsed.data.productId,
      type: parsed.data.type as EventType,
      userId,
      sessionId: parsed.data.sessionId,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
    })

    return ok({ tracked: true })
  } catch (err) {
    return internalError(err)
  }
}
