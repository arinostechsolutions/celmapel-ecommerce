import { NextRequest } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import connectDB from '@/lib/db/mongoose'
import Campaign from '@/lib/db/models/campaign'
import { ok, badRequest, internalError } from '@/lib/api/response'

const TrackSchema = z.object({
  utmCampaign: z.string().min(1),
  utmSource:   z.string().optional(),
  utmMedium:   z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = TrackSchema.safeParse(body)
    if (!parsed.success) return badRequest('Parâmetros inválidos')

    const rawStoreId = process.env.DEFAULT_STORE_ID ?? ''
    if (!rawStoreId || !mongoose.isValidObjectId(rawStoreId)) return ok({ tracked: false })

    await connectDB()

    // storeId é ObjectId no schema — precisa converter para o $match funcionar
    const storeOid = new mongoose.Types.ObjectId(rawStoreId)

    const result = await Campaign.findOneAndUpdate(
      {
        $or: [{ storeId: rawStoreId }, { storeId: storeOid }],
        utmCampaign: parsed.data.utmCampaign,
      },
      { $inc: { clickCount: 1 } }
    )

    if (!result) {
      // Nenhuma campanha encontrada — retorna ok para não expor info interna
      return ok({ tracked: false, reason: 'campaign_not_found' })
    }

    return ok({ tracked: true })
  } catch (err) {
    return internalError(err)
  }
}
