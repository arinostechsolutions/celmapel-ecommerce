export const dynamic = 'force-dynamic'

import connectDB  from '@/lib/db/mongoose'
import Event      from '@/lib/db/models/event'
import Campaign   from '@/lib/db/models/campaign'
import Order      from '@/lib/db/models/order'
import Store      from '@/lib/db/models/store'
import mongoose   from 'mongoose'
import { subDays, startOfDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PrintButton } from '@/components/dashboard/print-button'
import { formatCurrency } from '@/lib/utils'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

async function getReportData() {
  try {
    await connectDB()
    if (!mongoose.isValidObjectId(DEFAULT_STORE_ID)) throw new Error('storeId inválido')

    const storeOid = new mongoose.Types.ObjectId(DEFAULT_STORE_ID)
    const today    = startOfDay(new Date())
    const day30    = subDays(today, 30)
    const day7     = subDays(today, 7)

    const [
      store,
      views30, cartAdds30, checkouts30,
      views7,  cartAdds7,  checkouts7,
      activeCampaigns,
      topCampaigns,
      topViewed,
      topCheckout,
      recentOrders,
      orderTotals,
      rawByDay,
    ] = await Promise.all([
      Store.findById(DEFAULT_STORE_ID).lean(),
      Event.countDocuments({ storeId: DEFAULT_STORE_ID, type: 'view',               createdAt: { $gte: day30 } }),
      Event.countDocuments({ storeId: DEFAULT_STORE_ID, type: 'add_to_cart',        createdAt: { $gte: day30 } }),
      Event.countDocuments({ storeId: DEFAULT_STORE_ID, type: 'checkout_initiated', createdAt: { $gte: day30 } }),
      Event.countDocuments({ storeId: DEFAULT_STORE_ID, type: 'view',               createdAt: { $gte: day7  } }),
      Event.countDocuments({ storeId: DEFAULT_STORE_ID, type: 'add_to_cart',        createdAt: { $gte: day7  } }),
      Event.countDocuments({ storeId: DEFAULT_STORE_ID, type: 'checkout_initiated', createdAt: { $gte: day7  } }),
      Campaign.countDocuments({ storeId: DEFAULT_STORE_ID, isActive: true }),
      Campaign.find({ storeId: DEFAULT_STORE_ID }).sort({ clickCount: -1 }).limit(5).select('name clickCount utmSource utmMedium utmCampaign isActive').lean(),
      Event.aggregate([
        { $match: { storeId: storeOid, type: 'view', createdAt: { $gte: day30 } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $project: { name: '$p.name', count: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { storeId: storeOid, type: 'checkout_initiated', createdAt: { $gte: day30 } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $project: { name: '$p.name', count: 1, _id: 0 } },
      ]),
      Order.find({ storeId: DEFAULT_STORE_ID }).sort({ createdAt: -1 }).limit(20)
        .select('items subtotal discountAmount total createdAt utmCampaign').lean(),
      Order.aggregate([
        { $match: { storeId: storeOid, createdAt: { $gte: day30 } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Event.aggregate([
        { $match: { storeId: storeOid, createdAt: { $gte: day30 } } },
        { $group: { _id: { day: { $dateToString: { format: '%d/%m', date: '$createdAt' } }, type: '$type' }, count: { $sum: 1 } } },
        { $sort: { '_id.day': 1 } },
      ]),
    ])

    const conv30 = views30 > 0 ? ((checkouts30 / views30) * 100).toFixed(1) : '0.0'
    const conv7  = views7  > 0 ? ((checkouts7  / views7)  * 100).toFixed(1) : '0.0'
    const totalRevenue    = (orderTotals as Array<{ total: number; count: number }>)[0]?.total ?? 0
    const totalOrderCount = (orderTotals as Array<{ total: number; count: number }>)[0]?.count ?? 0

    // Pivota por dia
    const dayMap = new Map<string, { day: string; view: number; add_to_cart: number; checkout_initiated: number }>()
    for (const row of rawByDay) {
      const key = row._id.day as string
      if (!dayMap.has(key)) dayMap.set(key, { day: key, view: 0, add_to_cart: 0, checkout_initiated: 0 })
      const entry = dayMap.get(key)!
      const type  = row._id.type as 'view' | 'add_to_cart' | 'checkout_initiated'
      if (type in entry) entry[type] = row.count as number
    }
    const activityByDay = [...dayMap.values()]

    return {
      storeName: (store as { name?: string })?.name ?? 'Loja',
      generatedAt: format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      views30, cartAdds30, checkouts30, conv30,
      views7,  cartAdds7,  checkouts7,  conv7,
      activeCampaigns,
      topCampaigns:  topCampaigns  as Array<{ name: string; clickCount: number; utmSource: string; utmMedium: string; utmCampaign: string; isActive: boolean }>,
      topViewed:     topViewed     as Array<{ name: string; count: number }>,
      topCheckout:   topCheckout   as Array<{ name: string; count: number }>,
      recentOrders:  recentOrders  as Array<{ _id: unknown; items: Array<{ name: string; quantity: number; price: number }>; subtotal: number; discountAmount: number; total: number; createdAt: Date; utmCampaign?: string }>,
      totalRevenue, totalOrderCount,
      activityByDay,
    }
  } catch {
    return null
  }
}

export default async function ReportPage() {
  const d = await getReportData()

  if (!d) {
    return (
      <div className="p-8 text-center text-gray-400">
        Não foi possível carregar os dados do relatório.
      </div>
    )
  }

  const maxViewed   = d.topViewed[0]?.count   ?? 1
  const maxCheckout = d.topCheckout[0]?.count  ?? 1
  const maxCampaign = d.topCampaigns[0]?.clickCount ?? 1

  return (
    <>
      {/* Barra de ação — só aparece na tela, não no PDF */}
      <div className="print:hidden mb-6 flex items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-card px-5 py-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Relatório de Métricas</h1>
          <p className="text-sm text-gray-500">Gerado em {d.generatedAt}</p>
        </div>
        <PrintButton />
      </div>

      {/* ═══════════════════════════════════════════════
          CONTEÚDO DO RELATÓRIO (aparece na tela E no PDF)
      ═══════════════════════════════════════════════ */}
      <div id="report-content" className="space-y-8 print:space-y-6">

        {/* Cabeçalho do relatório */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 text-white rounded-2xl p-6 print:rounded-none print:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Relatório de Desempenho</p>
              <h2 className="text-2xl font-bold mt-1">{d.storeName}</h2>
              <p className="text-purple-200 text-sm mt-1">Gerado em {d.generatedAt}</p>
            </div>
            <div className="text-right">
              <p className="text-purple-200 text-xs">Período principal</p>
              <p className="text-white font-semibold">Últimos 30 dias</p>
            </div>
          </div>
        </div>

        {/* KPIs — 30 dias */}
        <Section title="Visão Geral — Últimos 30 dias">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiBox label="Visualizações"    value={d.views30.toLocaleString('pt-BR')}    sub="páginas de produto" color="blue"   />
            <KpiBox label="Adicionados"       value={d.cartAdds30.toLocaleString('pt-BR')} sub="ao carrinho"        color="purple" />
            <KpiBox label="Enviados WhatsApp" value={d.checkouts30.toLocaleString('pt-BR')}sub="checkouts"          color="green"  />
            <KpiBox label="Conversão"         value={`${d.conv30}%`}                       sub="view → WhatsApp"    color="pink"   />
          </div>
        </Section>

        {/* KPIs — 7 dias */}
        <Section title="Últimos 7 dias">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiBox label="Visualizações"    value={d.views7.toLocaleString('pt-BR')}    sub="7 dias" color="blue"   small />
            <KpiBox label="Adicionados"       value={d.cartAdds7.toLocaleString('pt-BR')} sub="7 dias" color="purple" small />
            <KpiBox label="WhatsApp"          value={d.checkouts7.toLocaleString('pt-BR')}sub="7 dias" color="green"  small />
            <KpiBox label="Conversão"         value={`${d.conv7}%`}                       sub="7 dias" color="pink"   small />
          </div>
        </Section>

        {/* Pedidos */}
        <Section title="Pedidos via WhatsApp">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <KpiBox label="Total de pedidos" value={String(d.totalOrderCount)} sub="últimos 30 dias" color="purple" />
            <KpiBox label="Valor estimado"   value={formatCurrency(d.totalRevenue)} sub="soma dos pedidos"  color="green"  />
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Pedido', 'Itens', 'Subtotal', 'Desconto', 'Total', 'Data', 'Campanha'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {d.recentOrders.map((o) => {
                  const id = String(o._id).slice(-6).toUpperCase()
                  const itemSummary = o.items.length === 1
                    ? `${o.items[0].name} ×${o.items[0].quantity}`
                    : `${o.items[0].name} +${o.items.length - 1}`
                  return (
                    <tr key={String(o._id)} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">#{id}</td>
                      <td className="px-3 py-2.5 text-gray-700 max-w-[160px] truncate">{itemSummary}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{formatCurrency(o.subtotal)}</td>
                      <td className="px-3 py-2.5 text-green-600 whitespace-nowrap">
                        {o.discountAmount > 0 ? `− ${formatCurrency(o.discountAmount)}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-gray-900 whitespace-nowrap">{formatCurrency(o.total)}</td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                        {format(new Date(o.createdAt), 'dd/MM/yy HH:mm')}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-purple-600 font-mono">
                        {o.utmCampaign ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Top Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
          <Section title="Produtos Mais Visualizados">
            <BarList items={d.topViewed.map((p) => ({ label: p.name, value: p.count, max: maxViewed, suffix: 'views' }))} color="purple" />
          </Section>
          <Section title="Produtos Mais Enviados ao WhatsApp">
            <BarList items={d.topCheckout.map((p) => ({ label: p.name, value: p.count, max: maxCheckout, suffix: 'envios' }))} color="green" />
          </Section>
        </div>

        {/* Campanhas */}
        {d.topCampaigns.length > 0 && (
          <Section title="Campanhas — Desempenho">
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Campanha', 'Fonte', 'Médium', 'UTM', 'Status', 'Cliques'].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {d.topCampaigns.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[160px] truncate">{c.name}</td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">{c.utmSource}</td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">{c.utmMedium}</td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">{c.utmCampaign}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.isActive ? 'Ativa' : 'Pausada'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${(c.clickCount / maxCampaign) * 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 tabular-nums">{c.clickCount.toLocaleString('pt-BR')}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Atividade diária (texto) */}
        {d.activityByDay.length > 0 && (
          <Section title="Atividade Diária — Últimos 30 dias">
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Data', 'Visualizações', 'Adicionados ao Carrinho', 'Enviados ao WhatsApp'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {d.activityByDay.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700 font-medium">{row.day}</td>
                      <td className="px-3 py-2 text-blue-600 tabular-nums">{row.view}</td>
                      <td className="px-3 py-2 text-purple-600 tabular-nums">{row.add_to_cart}</td>
                      <td className="px-3 py-2 text-green-600 tabular-nums">{row.checkout_initiated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Rodapé do relatório */}
        <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100 print:fixed print:bottom-4 print:left-0 print:right-0">
          Relatório gerado em {d.generatedAt} · {d.storeName}
        </div>
      </div>
    </>
  )
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 print:shadow-none print:border print:rounded-none">
      <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  )
}

function KpiBox({
  label, value, sub, color, small,
}: { label: string; value: string; sub: string; color: 'blue' | 'purple' | 'green' | 'pink'; small?: boolean }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    green:  'bg-green-50  text-green-700',
    pink:   'bg-pink-50   text-pink-700',
  }
  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <p className={`font-bold tabular-nums ${small ? 'text-xl' : 'text-2xl'}`}>{value}</p>
      <p className="text-xs font-semibold mt-0.5">{label}</p>
      <p className="text-xs opacity-70 mt-0.5">{sub}</p>
    </div>
  )
}

function BarList({ items, color }: {
  items: Array<{ label: string; value: number; max: number; suffix: string }>
  color: 'purple' | 'green'
}) {
  const bar = color === 'purple' ? 'bg-purple-500' : 'bg-green-500'
  return (
    <div className="space-y-2.5">
      {items.length === 0 && <p className="text-sm text-gray-400">Sem dados</p>}
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{item.label}</span>
            <span className="text-gray-500 tabular-nums shrink-0 ml-2">{item.value} {item.suffix}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${bar} rounded-full`} style={{ width: `${(item.value / item.max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
