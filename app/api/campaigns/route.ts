import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import Campaign from '@/lib/db/models/campaign'
import { ok, badRequest, unauthorized, forbidden, internalError } from '@/lib/api/response'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { checkRateLimit } from '@/lib/security/rate-limit'

const CreateCampaignSchema = z.object({
  name:        z.string().min(1, 'Nome obrigatório').max(200).trim(),
  description: z.string().max(500).optional(),
  utmSource:   z.string().min(1, 'utm_source obrigatório').max(100).trim(),
  utmMedium:   z.string().min(1, 'utm_medium obrigatório').max(100).trim(),
  utmCampaign: z.string().min(1, 'utm_campaign obrigatório').max(100).trim(),
  utmContent:  z.string().max(100).optional(),
  utmTerm:     z.string().max(100).optional(),
  startDate:   z.string().datetime().or(z.string().date()),
  endDate:     z.string().datetime().or(z.string().date()),
  isActive:    z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 'search')
  if (rl) return rl

  try {
    let payload
    try { payload = requireAuth(req); requireDashboardAccess(payload) }
    catch (e) { return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized() }

    await connectDB()
    const storeId = payload.storeId ?? process.env.DEFAULT_STORE_ID
    const campaigns = await Campaign.find({ storeId }).sort({ createdAt: -1 }).lean()
    return ok(campaigns)
  } catch (err) {
    return internalError(err)
  }
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 'search')
  if (rl) return rl

  try {
    let payload
    try { payload = requireAuth(req); requireDashboardAccess(payload) }
    catch (e) { return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized() }

    const body = await req.json()
    const parsed = CreateCampaignSchema.safeParse(body)
    if (!parsed.success) return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)

    const { startDate, endDate, ...rest } = parsed.data
    if (new Date(endDate) < new Date(startDate)) {
      return badRequest('Data de fim deve ser após a data de início')
    }

    await connectDB()
    const storeId = payload.storeId ?? process.env.DEFAULT_STORE_ID
    const campaign = await Campaign.create({
      ...rest,
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      storeId,
    })

    return ok(campaign, 201)
  } catch (err) {
    return internalError(err)
  }
}
