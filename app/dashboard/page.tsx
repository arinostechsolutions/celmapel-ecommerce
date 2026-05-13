export const dynamic = 'force-dynamic'

import { Eye, ShoppingCart, MessageCircle, TrendingUp, Megaphone, MousePointerClick, FileBarChart2 } from 'lucide-react'
import Link from 'next/link'
import { MetricCard }        from '@/components/dashboard/metric-card'
import { ActivityChart }     from '@/components/dashboard/activity-chart'
import { ConversionFunnel }  from '@/components/dashboard/conversion-funnel'
import { TopProductsChart }  from '@/components/dashboard/top-products-chart'
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table'
import connectDB  from '@/lib/db/mongoose'
import Event      from '@/lib/db/models/event'
import Campaign   from '@/lib/db/models/campaign'
import Order      from '@/lib/db/models/order'
import mongoose   from 'mongoose'
import { subDays, startOfDay } from 'date-fns'
import { serialize } from '@/lib/db/serialize'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY: DashboardData = {
  views: 0, cartAdds: 0, checkouts: 0, conversionRate: '0.0',
  activeCampaigns: 0, totalCampaignClicks: 0, topCampaigns: [],
  activityByDay: [],
  topViewed: [], topCheckout: [],
  recentOrders: [],
}

export interface DayActivity {
  day: string
  view: number
  add_to_cart: number
  checkout_initiated: number
}

export interface TopProduct    { name: string; count: number }
export interface TopCampaign   { name: string; clickCount: number }

interface DashboardData {
  views: number
  cartAdds: number
  checkouts: number
  conversionRate: string
  activeCampaigns: number
  totalCampaignClicks: number
  topCampaigns: TopCampaign[]
  activityByDay: DayActivity[]
  topViewed: TopProduct[]
  topCheckout: TopProduct[]
  recentOrders: unknown[]
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData(): Promise<DashboardData> {
  try {
    await connectDB()

    const rawId = process.env.DEFAULT_STORE_ID ?? ''
    if (!rawId || !mongoose.isValidObjectId(rawId)) return EMPTY

    const storeOid = new mongoose.Types.ObjectId(rawId)
    const today    = startOfDay(new Date())
    const monthAgo = subDays(today, 30)

    const [
      views,
      cartAdds,
      checkouts,
      activeCampaigns,
      rawClicksAgg,
      topCampaignsRaw,
      recentOrders,
      rawByDay,
      topViewed,
      topCheckout,
    ] = await Promise.all([
      Event.countDocuments({ storeId: rawId, type: 'view',               createdAt: { $gte: monthAgo } }),
      Event.countDocuments({ storeId: rawId, type: 'add_to_cart',        createdAt: { $gte: monthAgo } }),
      Event.countDocuments({ storeId: rawId, type: 'checkout_initiated', createdAt: { $gte: monthAgo } }),
      Campaign.countDocuments({ storeId: rawId, isActive: true }),

      // Total de cliques em campanhas
      Campaign.aggregate([
        { $match: { storeId: rawId } },
        { $group: { _id: null, total: { $sum: '$clickCount' } } },
      ]),

      // Top 5 campanhas por cliques
      Campaign.find({ storeId: rawId })
        .sort({ clickCount: -1 })
        .limit(5)
        .select('name clickCount')
        .lean(),

      Order.find({ storeId: rawId })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('items subtotal discountAmount total createdAt whatsappUrl utmSource utmMedium utmCampaign')
        .lean(),

      // Agrega {day, type, count} — aggregate não tem auto-cast, usa ObjectId
      Event.aggregate([
        { $match: { storeId: storeOid, createdAt: { $gte: monthAgo } } },
        {
          $group: {
            _id: {
              day:  { $dateToString: { format: '%d/%m', date: '$createdAt' } },
              type: '$type',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.day': 1 } },
      ]),

      Event.aggregate([
        { $match: { storeId: storeOid, type: 'view', createdAt: { $gte: monthAgo } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $project: { name: '$p.name', count: 1, _id: 0 } },
      ]),

      Event.aggregate([
        { $match: { storeId: storeOid, type: 'checkout_initiated', createdAt: { $gte: monthAgo } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $project: { name: '$p.name', count: 1, _id: 0 } },
      ]),
    ])

    // Pivota {day, type, count} → [{day, view, add_to_cart, checkout_initiated}]
    const dayMap = new Map<string, DayActivity>()
    for (const row of rawByDay) {
      const key = row._id.day as string
      if (!dayMap.has(key)) {
        dayMap.set(key, { day: key, view: 0, add_to_cart: 0, checkout_initiated: 0 })
      }
      const entry = dayMap.get(key)!
      const type  = row._id.type as keyof Omit<DayActivity, 'day'>
      if (type in entry) entry[type] = row.count as number
    }

    const activityByDay = [...dayMap.values()].sort((a, b) => {
      // Ordena por data real (dd/mm → mm/dd para comparação)
      const parse = (s: string) => { const [d, m] = s.split('/'); return +m * 100 + +d }
      return parse(a.day) - parse(b.day)
    })

    const conversionRate        = views > 0 ? ((checkouts / views) * 100).toFixed(1) : '0.0'
    const totalCampaignClicks   = (rawClicksAgg as Array<{ total: number }>)[0]?.total ?? 0
    const topCampaigns          = (topCampaignsRaw as Array<{ name: string; clickCount: number }>)
      .map(({ name, clickCount }) => ({ name, clickCount }))

    return {
      views, cartAdds, checkouts, conversionRate,
      activeCampaigns, totalCampaignClicks, topCampaigns,
      activityByDay,
      topViewed:    topViewed    as TopProduct[],
      topCheckout:  topCheckout  as TopProduct[],
      recentOrders: serialize(recentOrders),
    }
  } catch {
    return EMPTY
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const d = await getDashboardData()

  return (
    <div className="space-y-6">

      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-sm text-gray-500">Últimos 30 dias</p>
        </div>
        <Link
          href="/dashboard/relatorio"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileBarChart2 className="w-4 h-4 text-purple-600" />
          Exportar Relatório
        </Link>
      </div>

      {/* KPIs — linha 1: comportamento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Visualizações (30d)"       value={d.views.toLocaleString('pt-BR')}    icon={Eye}           color="blue"   />
        <MetricCard title="Adicionados ao carrinho"   value={d.cartAdds.toLocaleString('pt-BR')} icon={ShoppingCart}  color="purple" />
        <MetricCard title="Enviados ao WhatsApp"      value={d.checkouts.toLocaleString('pt-BR')}icon={MessageCircle} color="pink"   />
        <MetricCard title="Conversão (view→WhatsApp)" value={`${d.conversionRate}%`}             icon={TrendingUp}    color="green"  />
      </div>

      {/* KPIs — linha 2: campanhas */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard title="Campanhas ativas"     value={String(d.activeCampaigns)}                      icon={Megaphone}         color="amber" />
        <MetricCard title="Cliques via campanha" value={d.totalCampaignClicks.toLocaleString('pt-BR')}  icon={MousePointerClick} color="blue"  />
      </div>

      {/* Timeline + Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <h2 className="font-semibold text-gray-900 mb-1">Atividade — Últimos 30 dias</h2>
          <p className="text-xs text-gray-400 mb-4">Visualizações · Carrinho · WhatsApp por dia</p>
          <ActivityChart data={d.activityByDay} />
        </div>

        <ConversionFunnel
          views={d.views}
          cartAdds={d.cartAdds}
          checkouts={d.checkouts}
          activeCampaigns={d.activeCampaigns}
        />
      </div>

      {/* Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <h2 className="font-semibold text-gray-900 mb-1">Mais Visualizados</h2>
          <p className="text-xs text-gray-400 mb-4">Produtos com mais acessos na página (30d)</p>
          <TopProductsChart data={d.topViewed} color="#9333ea" />
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <h2 className="font-semibold text-gray-900 mb-1">Mais Enviados ao WhatsApp</h2>
          <p className="text-xs text-gray-400 mb-4">Produtos que mais geraram checkout via WhatsApp (30d)</p>
          <TopProductsChart data={d.topCheckout} color="#ec4899" />
        </div>
      </div>

      {/* Campanhas — top por cliques */}
      {d.topCampaigns.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Campanhas — Acessos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Cliques rastreados por utm_campaign</p>
            </div>
            <Link href="/dashboard/campanhas" className="text-xs text-purple-600 font-medium hover:text-purple-800 transition-colors">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {d.topCampaigns.map((c, i) => {
              const max = d.topCampaigns[0]?.clickCount ?? 1
              const pct = max > 0 ? (c.clickCount / max) * 100 : 0
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium truncate max-w-xs">{c.name}</span>
                    <span className="text-gray-500 tabular-nums shrink-0 ml-2">{c.clickCount.toLocaleString('pt-BR')} cliques</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Últimos pedidos */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
        <h2 className="font-semibold text-gray-900 mb-1">Últimos Pedidos via WhatsApp</h2>
        <p className="text-xs text-gray-400 mb-4">Registros de checkout iniciados na loja</p>
        <RecentOrdersTable orders={d.recentOrders as Parameters<typeof RecentOrdersTable>[0]['orders']} />
      </div>

    </div>
  )
}
