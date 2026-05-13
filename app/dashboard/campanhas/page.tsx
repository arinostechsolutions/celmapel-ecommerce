export const dynamic = 'force-dynamic'
import Link from 'next/link'
import connectDB from '@/lib/db/mongoose'
import Campaign from '@/lib/db/models/campaign'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { formatDate, buildUtmUrl } from '@/lib/utils'
import { CampaignCard } from '@/components/dashboard/campaign-card'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

import type { CampaignDocument } from '@/lib/db/models/campaign'

export default async function CampaignsPage() {
  let campaigns: CampaignDocument[] = []
  try {
    await connectDB()
    campaigns = await Campaign.find({ storeId: DEFAULT_STORE_ID })
      .sort({ createdAt: -1 })
      .lean() as unknown as CampaignDocument[]
  } catch { /* sem banco configurado */ }

  const campaignsWithUrl = campaigns.map((c) => ({
    id:          String(c._id),
    name:        c.name,
    description: c.description,
    isActive:    c.isActive,
    clickCount:  c.clickCount,
    utmSource:   c.utmSource,
    utmMedium:   c.utmMedium,
    utmCampaign: c.utmCampaign,
    startDate:   formatDate(c.startDate),
    endDate:     formatDate(c.endDate),
    utmUrl: buildUtmUrl(APP_URL, {
      utm_source:   c.utmSource,
      utm_medium:   c.utmMedium,
      utm_campaign: c.utmCampaign,
      utm_content:  c.utmContent,
      utm_term:     c.utmTerm,
    }),
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} criada{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/campanhas/nova" className="shrink-0">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Campanha</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {campaigns.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Nenhuma campanha criada ainda
          </div>
        )}
        {campaignsWithUrl.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  )
}
